import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * The AgentZ bot, rebuilt in three.js from the flat mascot kit.
 *
 * The SVG draws the bot in a fixed three-quarter view: a gradient shell, a
 * grey face plate, a black visor with two cyan eyes, and a round ear. Here
 * each of those is a real surface. The shell keeps the red, violet and blue
 * sweep as vertex colours under a clearcoat, the visor is a glossy bump that
 * catches the room light, and the head turns toward the pointer.
 *
 * Front is +z and the ear sits on -x, so a yaw of about 0.6 rad gives the
 * same pose as the SVG. Every one of the ten states in the kit maps to a pose,
 * an eye shape and an effect, and the loop eases between poses rather than
 * cutting, so a state change reads as the bot reacting.
 */

export type BotState =
  | 'idle'
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'processing'
  | 'speaking'
  | 'success'
  | 'error'
  | 'threat'
  | 'sleeping'

export type Bot = {
  setState: (s: BotState) => void
  setPointer: (x: number, y: number) => void
  start: () => void
  stop: () => void
  renderOnce: () => void
  dispose: () => void
}

const C = {
  red: 0xc80019,
  violet: 0x6464ff,
  navy: 0x0000c8,
  plate: 0xe7e9eb,
  visor: 0x05050c,
  eye: 0x35ccfc,
  earCore: 0x9696ff,
  earMid: 0x0c0ca8,
  alert: 0xff3355,
  blue: 0x2f4bd6,
}

/** Visor ellipsoid: centre and radii. Eyes and effects sit on its surface. */
const VISOR = { x: 0.14, y: -0.02, z: 0.78, sx: 0.6, sy: 0.4, sz: 0.3 }
const onVisor = (dx: number, dy: number, lift = 0.01) => {
  const u = (dx / VISOR.sx) ** 2 + (dy / VISOR.sy) ** 2
  return new THREE.Vector3(VISOR.x + dx, VISOR.y + dy, VISOR.z + VISOR.sz * Math.sqrt(Math.max(0, 1 - u)) + lift)
}
const EYE_DX = 0.24

function spriteTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d')!, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))

export function createBot(canvas: HTMLCanvasElement): Bot {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 0.35, 7.4)
  camera.lookAt(0, 0.1, 0)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3d6, 0.9))
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x6f86ff, 2.2)
  rim.position.set(-4, 2, -3)
  scene.add(rim)
  // the eyes light the face plate, and the tint follows the state
  const eyeGlow = new THREE.PointLight(C.eye, 1.4, 3, 2)
  scene.add(eyeGlow)

  const disposables: { dispose: () => void }[] = [envTex, pmrem]
  const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x)

  /* ── the head ── */
  const root = new THREE.Group() // turns toward the pointer
  const body = new THREE.Group() // floats, hops, shakes
  root.add(body)
  scene.add(root)

  // shell: the kit's red to violet to blue sweep, as vertex colours
  const shellGeo = keep(new THREE.SphereGeometry(1, 96, 64))
  {
    const pos = shellGeo.attributes.position
    const col = new Float32Array(pos.count * 3)
    const dir = new THREE.Vector3(-0.7, -0.62, 0.25).normalize()
    const red = new THREE.Color(C.red)
    const vio = new THREE.Color(C.violet)
    const nav = new THREE.Color(C.navy)
    const v = new THREE.Vector3()
    const out = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize()
      const t = (1 - v.dot(dir)) / 2 // 0 at the red pole, 1 opposite
      if (t < 0.5) out.copy(red).lerp(vio, t / 0.5)
      else out.copy(vio).lerp(nav, (t - 0.5) / 0.5)
      col.set([out.r, out.g, out.b], i * 3)
    }
    shellGeo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  }
  const shell = new THREE.Mesh(
    shellGeo,
    keep(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12 })),
  )
  shell.scale.set(1, 0.97, 1)
  body.add(shell)

  // face plate: a cap over the top, front and ear side, so the shell shows as
  // a rim along the bottom and the back, as it does in the flat kit
  const plate = new THREE.Mesh(
    keep(new THREE.SphereGeometry(1.025, 96, 64, -0.75, Math.PI * 0.62 + 0.75 + 0.55, 0, 1.98)),
    keep(new THREE.MeshPhysicalMaterial({ color: C.plate, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3 })),
  )
  plate.scale.set(1, 0.97, 1)
  body.add(plate)

  const visor = new THREE.Mesh(
    keep(new THREE.SphereGeometry(1, 64, 48)),
    keep(new THREE.MeshPhysicalMaterial({ color: C.visor, roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04 })),
  )
  visor.position.set(VISOR.x, VISOR.y, VISOR.z)
  visor.scale.set(VISOR.sx, VISOR.sy, VISOR.sz)
  body.add(visor)

  // ear: white rim, navy well, glowing core. It sits front-left rather than
  // dead on the side, so in the resting pose it faces the viewer as it does
  // in the flat kit instead of showing its edge
  const EAR_DIR = new THREE.Vector3(-0.8, -0.02, 0.6).normalize()
  const ear = new THREE.Group()
  ear.position.copy(EAR_DIR).multiplyScalar(0.96)
  ear.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), EAR_DIR)
  ear.scale.set(1, 1, 1.15)
  const earDisc = (r: number, h: number, mat: THREE.Material, y: number) => {
    const m = new THREE.Mesh(keep(new THREE.CylinderGeometry(r, r, h, 48)), mat)
    m.position.y = y
    ear.add(m)
    return m
  }
  earDisc(0.31, 0.12, keep(new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 1 })), 0.02)
  earDisc(0.21, 0.12, keep(new THREE.MeshPhysicalMaterial({ color: C.earMid, roughness: 0.35 })), 0.05)
  const earCoreMat = keep(new THREE.MeshBasicMaterial({ color: C.earCore }))
  earDisc(0.11, 0.12, earCoreMat, 0.08)
  body.add(ear)

  /* ── eyes, one group per expression ── */
  const eyeMat = keep(new THREE.MeshBasicMaterial({ color: C.eye }))
  const faces: Record<string, THREE.Group> = {}
  const face = (name: string) => {
    const g = new THREE.Group()
    body.add(g)
    faces[name] = g
    return g
  }

  const round = face('round')
  const eyeGeo = keep(new THREE.SphereGeometry(1, 32, 24))
  const eyes = [-EYE_DX, EYE_DX].map((dx) => {
    const e = new THREE.Mesh(eyeGeo, eyeMat)
    e.position.copy(onVisor(dx, 0.01, -0.02))
    e.scale.set(0.095, 0.12, 0.04)
    e.lookAt(e.position.clone().multiplyScalar(2))
    round.add(e)
    return e
  })

  const arcGeo = keep(new THREE.TorusGeometry(0.09, 0.03, 10, 24, Math.PI))
  const arcs = (name: string, flip: boolean) => {
    const g = face(name)
    for (const dx of [-EYE_DX, EYE_DX]) {
      const a = new THREE.Mesh(arcGeo, eyeMat)
      a.position.copy(onVisor(dx, flip ? 0.03 : -0.03, 0.0))
      a.lookAt(a.position.clone().multiplyScalar(2))
      if (flip) a.rotateZ(Math.PI)
      g.add(a)
    }
    return g
  }
  arcs('happy', false)
  const sleepy = arcs('sleepy', true)
  sleepy.children.forEach((c) => ((c as THREE.Mesh).material = keep(new THREE.MeshBasicMaterial({ color: C.eye, transparent: true, opacity: 0.7 }))))

  const crossMat = keep(new THREE.MeshBasicMaterial({ color: C.alert }))
  const cross = face('cross')
  const barGeo = keep(new THREE.BoxGeometry(0.26, 0.055, 0.03))
  for (const dx of [-EYE_DX, EYE_DX]) {
    for (const r of [Math.PI / 4, -Math.PI / 4]) {
      const b = new THREE.Mesh(barGeo, crossMat)
      b.position.copy(onVisor(dx, 0.0, 0.005))
      b.lookAt(b.position.clone().multiplyScalar(2))
      b.rotateZ(r)
      cross.add(b)
    }
  }

  // angry: red eyes under a cut brow, as in the threat alert frame
  const angry = face('angry')
  const angryMat = keep(new THREE.MeshBasicMaterial({ color: C.alert }))
  const browMat = keep(new THREE.MeshBasicMaterial({ color: C.visor }))
  const browGeo = keep(new THREE.BoxGeometry(0.3, 0.12, 0.06))
  for (const dx of [-EYE_DX, EYE_DX]) {
    const e = new THREE.Mesh(eyeGeo, angryMat)
    e.position.copy(onVisor(dx, -0.01, -0.02))
    e.scale.set(0.1, 0.11, 0.04)
    e.lookAt(e.position.clone().multiplyScalar(2))
    angry.add(e)
    const b = new THREE.Mesh(browGeo, browMat)
    b.position.copy(onVisor(dx, 0.1, 0.02))
    b.lookAt(b.position.clone().multiplyScalar(2))
    b.rotateZ(dx < 0 ? -0.42 : 0.42)
    angry.add(b)
  }

  const dots = face('dots')
  const dotMeshes = [-0.2, 0, 0.2].map((dx) => {
    const d = new THREE.Mesh(eyeGeo, eyeMat)
    d.scale.setScalar(0.06)
    d.position.copy(onVisor(dx, 0, 0.0))
    dots.add(d)
    return d
  })

  // speaking keeps the round eyes and adds a meter between them
  const meter = face('meter')
  const meterMat = keep(new THREE.MeshBasicMaterial({ color: C.earCore }))
  const meterGeo = keep(new THREE.BoxGeometry(0.035, 0.2, 0.02))
  const meterBars = [-0.075, -0.025, 0.025, 0.075].map((dx) => {
    const b = new THREE.Mesh(meterGeo, meterMat)
    b.position.copy(onVisor(dx, 0, 0.005))
    b.lookAt(b.position.clone().multiplyScalar(2))
    meter.add(b)
    return b
  })

  /* ── effects ── */
  const fx = new THREE.Group()
  scene.add(fx)

  // listening: rings leave the ear
  const ringGeo = keep(new THREE.TorusGeometry(0.36, 0.014, 8, 64))
  const ringMat = [0, 1].map(() => keep(new THREE.MeshBasicMaterial({ color: C.eye, transparent: true, opacity: 0 })))
  const rings = ringMat.map((m) => {
    const r = new THREE.Mesh(ringGeo, m)
    r.rotation.x = Math.PI / 2
    r.position.y = 0.1
    ear.add(r)
    return r
  })

  // threat: a radar pulse around the whole head, facing the camera
  const pulseMat = keep(new THREE.MeshBasicMaterial({ color: C.alert, transparent: true, opacity: 0 }))
  const pulse = new THREE.Mesh(keep(new THREE.TorusGeometry(1.25, 0.02, 8, 96)), pulseMat)
  fx.add(pulse)

  // thinking: bubbles rise off the top right
  const bubbleMat = keep(new THREE.MeshPhysicalMaterial({ color: C.earCore, roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0 }))
  const bubbles = [0.07, 0.1, 0.14].map((r, i) => {
    const b = new THREE.Mesh(eyeGeo, bubbleMat.clone())
    keep(b.material as THREE.Material)
    b.scale.setScalar(r)
    b.position.set(0.95 + i * 0.22, 0.75 + i * 0.3, 0.2)
    fx.add(b)
    return b
  })

  // success: sparkles; error and threat reuse nothing from here
  const sparkGeo = keep(new THREE.OctahedronGeometry(0.09, 0))
  const sparks = [
    [1.3, 1.05, 0.2, 0xffc94d],
    [-1.25, 0.55, 0.3, C.eye],
    [0.35, 1.45, 0.1, C.earCore],
    [1.45, -0.2, 0.4, C.earCore],
  ].map(([x, y, z, c]) => {
    const m = new THREE.Mesh(sparkGeo, keep(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0 })))
    m.position.set(x, y, z)
    m.scale.set(0.6, 1.4, 0.6)
    fx.add(m)
    return m
  })

  const badge = (draw: (g: CanvasRenderingContext2D, s: number) => void) => {
    const s = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: keep(spriteTexture(128, draw)), transparent: true, opacity: 0, depthTest: false })))
    s.scale.setScalar(0.5)
    fx.add(s)
    return s
  }
  const disc = (g: CanvasRenderingContext2D, s: number, fill: string) => {
    g.beginPath()
    g.arc(s / 2, s / 2, s / 2 - 6, 0, Math.PI * 2)
    g.fillStyle = fill
    g.fill()
    g.lineWidth = 9
    g.strokeStyle = '#fff'
    g.stroke()
  }
  const check = badge((g, s) => {
    disc(g, s, '#2f4bd6')
    g.strokeStyle = '#fff'
    g.lineWidth = 12
    g.lineCap = g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(s * 0.3, s * 0.52)
    g.lineTo(s * 0.45, s * 0.66)
    g.lineTo(s * 0.72, s * 0.38)
    g.stroke()
  })
  check.position.set(0.85, -0.7, 0.9)
  const alertBadge = badge((g, s) => {
    disc(g, s, '#c80019')
    g.fillStyle = '#fff'
    g.fillRect(s / 2 - 7, s * 0.25, 14, s * 0.32)
    g.beginPath()
    g.arc(s / 2, s * 0.7, 8, 0, Math.PI * 2)
    g.fill()
  })
  alertBadge.position.set(1.05, 0.95, 0.5)

  const zs = [0, 1, 2].map((i) =>
    badge((g, s) => {
      g.font = `700 ${s * 0.8}px "Space Grotesk", sans-serif`
      g.fillStyle = '#9696ff'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(i === 2 ? 'Z' : 'z', s / 2, s / 2)
    }),
  )

  // soft contact shadow, which shrinks as the bot lifts
  const shadow = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(2.6, 2.6)),
    keep(
      new THREE.MeshBasicMaterial({
        map: keep(
          spriteTexture(128, (g, s) => {
            const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
            r.addColorStop(0, 'rgba(10,10,50,.55)')
            r.addColorStop(1, 'rgba(10,10,50,0)')
            g.fillStyle = r
            g.fillRect(0, 0, s, s)
          }),
        ),
        transparent: true,
        depthWrite: false,
      }),
    ),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -1.45
  shadow.scale.set(1, 0.5, 1)
  scene.add(shadow)

  /* ── loop ── */
  let state: BotState = 'idle'
  let since = 0 // seconds in the current state
  let clock = 0
  let pointer = { x: 0, y: 0 }
  const look = { yaw: 0.6, pitch: 0 }
  const pose = { y: 0, rz: 0, sx: 1, sy: 1 }
  const opacity = new Map<THREE.Material, number>()
  const fade = (m: THREE.Material & { opacity: number }, to: number, dt: number) => {
    const v = damp(opacity.get(m) ?? m.opacity, to, 10, dt)
    opacity.set(m, v)
    m.opacity = v
  }

  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // the field of view is vertical, so on a tall stage the camera steps
      // back until about 3.2 units fit across, or the head fills a phone
      camera.position.z = Math.max(7.4, 3.2 / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect))
      camera.updateProjectionMatrix()
    }
  }

  function frame(dt: number) {
    clock += dt
    since += dt
    const t = clock
    const s = state

    /* where it looks: pointer, plus the state's own glance */
    let yaw = 0.6 + pointer.x * 0.55
    let pitch = -pointer.y * 0.3
    if (s === 'listening') yaw += 0.3 // turns its ear toward you
    if (s === 'sleeping') pitch = 0.22
    if (s === 'thinking') {
      yaw += Math.sin(t * 1.7) * 0.18
      pitch -= 0.12
    }
    look.yaw = damp(look.yaw, yaw, 5, dt)
    look.pitch = damp(look.pitch, pitch, 5, dt)
    root.rotation.set(look.pitch, look.yaw, 0)

    /* body pose */
    let y = Math.sin(t * ((Math.PI * 2) / 3.2)) * 0.08
    let rz = 0
    let sx = 1
    let sy = 1
    let shake = 0
    if (s === 'greeting') {
      const p = (since % 2.4) / 2.4
      rz = p < 0.3 ? -Math.sin((p / 0.3) * Math.PI) * 0.14 : Math.sin(((p - 0.3) / 0.45) * Math.PI * 2) * 0.1 * Math.max(0, 1 - (p - 0.3) / 0.45)
      y += p < 0.3 ? Math.sin((p / 0.3) * Math.PI) * 0.22 : 0
    } else if (s === 'success') {
      const p = (since % 1.6) / 1.6
      if (p < 0.1) {
        sx = 1.07
        sy = 0.93
      } else if (p < 0.6) {
        const k = Math.sin(((p - 0.1) / 0.5) * Math.PI)
        y = k * 0.4
        sx = 1 - k * 0.03
        sy = 1 + k * 0.04
      } else y = 0
    } else if (s === 'error') {
      const p = (since % 2.2) / 2.2
      shake = p < 0.35 ? Math.sin(p * 60) * 0.11 * (1 - p / 0.35) : 0
      y = 0
    } else if (s === 'sleeping') {
      y = -0.06
      const b = Math.sin(t * ((Math.PI * 2) / 4))
      sx = 1 + b * 0.02
      sy = 1 - b * 0.02
    } else if (s === 'threat') {
      y = 0
      shake = Math.sin(t * 40) * 0.008
    } else if (s === 'speaking' || s === 'listening') {
      y *= 0.4
    }
    pose.y = damp(pose.y, y, s === 'success' ? 30 : 8, dt)
    pose.rz = damp(pose.rz, rz, 14, dt)
    pose.sx = damp(pose.sx, sx, 20, dt)
    pose.sy = damp(pose.sy, sy, 20, dt)
    body.position.set(shake, pose.y, 0)
    body.rotation.z = pose.rz
    body.scale.set(pose.sx, pose.sy, pose.sx)
    shadow.scale.set(1 - pose.y * 0.5, 0.5 - pose.y * 0.25, 1)
    ;(shadow.material as THREE.MeshBasicMaterial).opacity = 1 - pose.y * 0.9

    /* which face shows */
    const want: Record<BotState, string[]> = {
      idle: ['round'],
      greeting: ['happy'],
      listening: ['round'],
      thinking: ['round'],
      processing: ['dots'],
      speaking: ['round', 'meter'],
      success: ['happy'],
      error: ['cross'],
      threat: ['angry'],
      sleeping: ['sleepy'],
    }
    for (const [n, g] of Object.entries(faces)) g.visible = want[s].includes(n)

    // blink every four seconds; thinking eyes scan instead
    const bp = t % 4
    const blink = bp > 3.72 && bp < 3.9 ? 0.12 : 1
    round.scale.set(1, 1, 1)
    eyes.forEach((e) => (e.scale.y = 0.12 * (s === 'thinking' ? 1 : blink)))
    if (s === 'thinking') round.position.set(Math.sin(t * 1.75) * 0.06, 0.05 + Math.cos(t * 1.2) * 0.02, 0)
    else round.position.set(0, 0, 0)
    if (s === 'speaking') eyes.forEach((e, i) => (e.position.x = onVisor((i ? 1 : -1) * 0.3, 0).x))
    else eyes.forEach((e, i) => (e.position.x = onVisor((i ? 1 : -1) * EYE_DX, 0).x))

    dotMeshes.forEach((d, i) => {
      const p = ((t - i * 0.15) % 1.2) / 1.2
      const k = p < 0.7 ? Math.sin((p / 0.7) * Math.PI) : 0
      d.position.y = VISOR.y + k * 0.1
    })
    meterBars.forEach((b, i) => (b.scale.y = 0.35 + 0.65 * Math.abs(Math.sin(t * 3.5 + i * 0.9))))
    cross.visible = cross.visible && !(Math.floor(t * 9) % 7 === 0) // glitch flicker
    angryMat.color.setHex(Math.sin(t * 5.2) > -0.3 ? C.alert : 0xb3243b)

    /* ear core and eye light */
    const earTo =
      s === 'listening' ? new THREE.Color(C.earCore).lerp(new THREE.Color(C.eye), (Math.sin(t * 3.5) + 1) / 2) :
      s === 'threat' ? new THREE.Color(C.alert) :
      s === 'error' || s === 'sleeping' ? new THREE.Color(0x5a5ab0) :
      new THREE.Color(C.earCore)
    earCoreMat.color.lerp(earTo, 1 - Math.exp(-8 * dt))
    const glowTo = s === 'threat' || s === 'error' ? C.alert : C.eye
    eyeGlow.color.lerp(new THREE.Color(glowTo), 1 - Math.exp(-6 * dt))
    eyeGlow.intensity = damp(eyeGlow.intensity, s === 'sleeping' ? 0.3 : s === 'threat' ? 2.4 : 1.4, 6, dt)
    eyeGlow.position.copy(body.localToWorld(onVisor(0, 0, 0.5)))

    /* effects */
    rings.forEach((r, i) => {
      const p = ((t + i * 0.9) % 1.8) / 1.8
      r.scale.setScalar(0.9 + p * 0.8)
      fade(ringMat[i], s === 'listening' ? 0.9 * (1 - p) : 0, dt * 3)
    })
    {
      const p = (t % 1.2) / 1.2
      pulse.scale.setScalar(1 + p * 0.18)
      pulse.position.y = body.position.y
      fade(pulseMat, s === 'threat' ? 0.75 * (1 - p) : 0, dt * 3)
    }
    bubbles.forEach((b, i) => {
      const p = ((t - i * 0.3) % 1.8) / 1.8
      const k = p < 0.4 ? p / 0.4 : p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3
      b.scale.setScalar([0.07, 0.1, 0.14][i] * (0.4 + 0.6 * k))
      fade(b.material as THREE.MeshPhysicalMaterial, s === 'thinking' ? k : 0, dt * 2)
    })
    sparks.forEach((m, i) => {
      const p = ((t - i * 0.4) % 1.6) / 1.6
      const k = p < 0.3 ? p / 0.3 : p < 0.6 ? 1 : Math.max(0, 1 - (p - 0.6) / 0.3)
      m.rotation.y = t * 3 + i
      m.scale.set(0.6 * k + 0.01, 1.4 * k + 0.01, 0.6 * k + 0.01)
      fade(m.material as THREE.MeshBasicMaterial, s === 'success' ? k : 0, dt * 2)
    })
    check.position.y = -0.7 + pose.y
    fade(check.material, s === 'success' ? 1 : 0, dt)
    fade(alertBadge.material, s === 'threat' ? (Math.sin(t * 5.2) > -0.3 ? 1 : 0.55) : 0, dt * 2)
    zs.forEach((z, i) => {
      const p = ((t - i) % 3) / 3
      z.position.set(0.9 + p * 0.45, 0.8 + p * 1.1, 0.3)
      z.scale.setScalar(0.22 + i * 0.08 + p * 0.12)
      fade(z.material, s === 'sleeping' ? (p < 0.2 ? p / 0.2 : 1 - p) : 0, dt * 3)
    })

    resize()
    renderer.render(scene, camera)
  }

  let raf = 0
  let last = 0
  const loop = (now: number) => {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
    last = now
    frame(dt)
    raf = requestAnimationFrame(loop)
  }

  return {
    setState(s) {
      if (s === state) return
      state = s
      since = 0
    },
    setPointer(x, y) {
      pointer = { x, y }
    },
    start() {
      if (raf) return
      last = 0
      raf = requestAnimationFrame(loop)
    },
    stop() {
      cancelAnimationFrame(raf)
      raf = 0
    },
    renderOnce() {
      // settle every eased value, then draw one still frame
      for (let i = 0; i < 90; i++) frame(1 / 60)
    },
    dispose() {
      cancelAnimationFrame(raf)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
    },
  }
}
