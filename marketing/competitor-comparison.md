# AgentZ Competitor Comparison

Written 27 July 2026. This space moves fast, so check anything before it goes in a deck or on the site.

**This is now live on the site** in the Comparison section, one table with all eight products. Row labels lead with the industry term and carry the plain reading in brackets, and every mark reveals its own reasoning on hover. All of it comes from `agentz-react/src/data/comparison.ts`. Edit that file and the site follows. Keep this document and that file in step.

**Where the facts come from.** The AgentZ column comes from this repo and from the team. Everything about other products comes from their own documentation and from 2026 reporting, all linked at the bottom.

---

## What AgentZ is up against

AgentZ helps a company build agents, run them, and stay in control of what they do. So the competition is other places you could put your agents. It is not CrowdStrike or Wiz. Those companies sell security for agents, but they do not run your agents for you.

The people choosing between these options are usually engineering leads deciding where their company's agents will live. Two very different sets of products land on that list.

**Group one, the business platforms.** You pay for them, and they come with a support contract.

| Product | Why it matters |
|---|---|
| **LangGraph Platform** | What most engineering teams reach for first. |
| **CrewAI AMP** | Built for many agents working together. Has a real business tier. |
| **Microsoft Foundry Agents** | The obvious choice if the company already runs on Microsoft. |
| **AWS Bedrock AgentCore** | The obvious choice if the company already runs on Amazon. |

**Group two, the free ones people already downloaded.** These are enormously popular, and often already running inside a company before anyone in charge knows about it.

| Product | Why it matters |
|---|---|
| **OpenClaw** | 347,000 GitHub stars, the most-starred project in GitHub's history. Free. |
| **Hermes Agent** | From Nous Research. 175,000 stars in four months, and handling 224 billion words a day. |
| **n8n** | The long-standing free option for wiring up automated tasks. |

Left out on purpose: OpenAI's Agent Builder is being switched off on 30 November 2026, Dify is much the same as n8n with fewer connections, and Google's agent builder tells the same story as Microsoft and Amazon.

---

## How they compare

✅ works out of the box  ·  ➖ possible, but costs extra or you build it yourself  ·  ❌ you do not get it

### Against the business platforms

| | **AgentZ** | LangGraph | CrewAI AMP | Microsoft | AWS |
|---|---|---|---|---|---|
| **Zero trust, default deny** (safe on day one) | ✅ | ❌ | ➖ | ➖ | ➖ |
| **Network egress control** (you choose where it can go online) | ✅ | ❌ | ❌ | ➖ | ➖ |
| **Zero secret exfiltration** (the agent never sees your passwords) | ✅ | ❌ | ➖ | ➖ | ➖ |
| **Fine-grained access control** (permission for each action) | ✅ | ➖ | ➖ | ➖ | ➖ |
| **Tamper-evident audit trail** (a record that cannot be edited) | ✅ | ➖ | ➖ | ➖ | ➖ |
| **On-premises** (runs on your own servers) | ✅ | ➖ | ✅ | ➖ | ❌ |
| **Air-gapped** (no internet connection at all) | ✅ | ❌ | ➖ | ➖ | ❌ |
| **Model agnostic** (any AI model, on your own account) | ✅ | ✅ | ✅ | ➖ | ➖ |
| **Inference pricing and pool picking** (see what the AI costs) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Dynamic skill creation** (describe a job, it builds it) | ✅ | ❌ | ❌ | ➖ | ❌ |
| **Single control plane** (agents, models and people in one place) | ✅ | ➖ | ➖ | ➖ | ➖ |
| **Time to a working agent** | Minutes | Days | Days | Hours | Days |

### Against the free ones

| | **AgentZ** | OpenClaw | Hermes Agent | n8n |
|---|---|---|---|---|
| **Zero trust, default deny** (safe on day one) | ✅ | ❌ | ➖ | ❌ |
| **Network egress control** (you choose where it can go online) | ✅ | ❌ | ➖ | ❌ |
| **Zero secret exfiltration** (the agent never sees your passwords) | ✅ | ❌ stored as plain text | ➖ | ❌ |
| **Fine-grained access control** (permission for each action) | ✅ | ❌ | ➖ asks before each tool | ➖ |
| **Tamper-evident audit trail** (a record that cannot be edited) | ✅ | ❌ | ❌ | ❌ |
| **Multi-user and roles** (built for a team, not one person) | ✅ | ❌ | ❌ planned, not built | ➖ |
| **On-premises** (runs on your own servers) | ✅ | ✅ | ✅ | ✅ |
| **Air-gapped** (no internet connection at all) | ✅ | ➖ | ✅ | ➖ |
| **Model agnostic** (any AI model, on your own account) | ✅ | ✅ | ✅ | ✅ |
| **Inference pricing and pool picking** (see what the AI costs) | ✅ | ❌ | ❌ | ❌ |
| **Dynamic skill creation** (describe a job, it builds it) | ✅ | ➖ | ✅ learns its own skills | ❌ |
| **Commercial support** (somebody to call when it breaks) | ✅ | ❌ | ❌ | ➖ |

Credit where it is due. Hermes genuinely builds its own skills as it works, and it is the one product here that matches AgentZ on that. OpenClaw and Hermes both run happily on your own machine. What neither was built for is a company: no way to say who is allowed to do what, no record you could hand an auditor, and nobody to call at 2am.

---

## The things only AgentZ does

**Runs anywhere, same product.** Your own servers, our cloud, or a room with no internet. One product, not a cut-down version. LangGraph makes you pay for the top tier to self-host. AWS has no way to run it on your own hardware at all. Microsoft can go offline only if you switch to a different, smaller product.

**The agent never sees your passwords.** Keys stay locked away and AgentZ makes the call on the agent's behalf. Everywhere else, the password ends up somewhere the agent can read it. OpenClaw simply saves them as plain text on disk.

**Describe a job, get an agent.** Say what you want in a sentence and AgentZ writes the steps. On most of these you are writing code first.

**One place for everything.** Agents, models, people and the record of what happened, all together. Amazon and Microsoft only do this inside their own world. The free ones only handle one person.

**And you can see what the AI costs.** Pick which pool of models a job runs against, and see the price per run. Nobody else on this list shows you that.

---

## Why this is the part that matters

Some numbers from this year:

- **88 out of every 100 companies** had an AI agent security incident, or think they did.
- Agents being tricked by hidden instructions is now the **number one AI security problem** in the industry.
- A flaw called **EchoLeak** let an attacker quietly pull company data out of Microsoft 365 Copilot by hiding instructions in the notes of a PowerPoint slide. Nobody had to click anything.
- **AWS's agent sandbox has been broken into twice** in public, by two different security teams. Amazon now tells customers who need real separation to use a different setting.
- **OpenClaw has had a full takeover flaw** (CVE-2026-25253), hundreds of malicious add-ons built to steal passwords and crypto, and roughly **one in four community add-ons carries a security hole**. Microsoft has published a guide on how to run it without getting hurt.

The shape of the problem is the same every time. The agent reads something from outside, the agent can reach the internet, and the agent can get at a password. Take away any one of those three and the attack stops working.

Most products bolt security on after the fact and keep all three. AgentZ starts locked down, so the third one is missing from the start.

---

## The short version for each

| Product | What to say |
|---|---|
| **LangGraph** | Great for writing an agent. AgentZ is for running it in front of customers, with rules and a record. LangGraph works fine on top. |
| **CrewAI AMP** | Solid at coordinating agents. Security came later and it shows. |
| **Microsoft Foundry** | Excellent, as long as every model, agent and person lives inside Microsoft. |
| **AWS AgentCore** | A sandbox that has been publicly broken twice, and no way off Amazon. |
| **OpenClaw** | Brilliant for one curious person. Passwords in plain text and a takeover flaw make it a bad fit for company data. |
| **Hermes Agent** | Genuinely clever, and the closest thing to AgentZ's skill building. Has no concept of a team, permissions, or an audit trail. |
| **n8n** | Free until the first incident. You host it, so the whole security problem is yours. |

---

## Sources

- [AWS Bedrock AgentCore, isolated sessions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-sessions.html) and [security best practices](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-security-best-practices.html)
- [Unit 42, escaping the AWS AgentCore sandbox](https://unit42.paloaltonetworks.com/bypass-of-aws-sandbox-network-isolation-mode/)
- [BeyondTrust, bypassing the same sandbox via DNS](https://www.beyondtrust.com/blog/entry/pwning-aws-agentcore-code-interpreter)
- [LangGraph Platform pricing and deployment tiers](https://agentsapis.com/langchain/langgraph-pricing/)
- [CrewAI pricing, free versus business](https://techjacksolutions.com/ai-tools/crewai/crewai-pricing/)
- [What's new in Microsoft Foundry, June 2026](https://devblogs.microsoft.com/foundry/whats-new-in-microsoft-foundry-june-2026/)
- [OpenClaw on Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) and [what OpenClaw is, DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-openclaw)
- [ClawJacked, full agent takeover, Oasis Security](https://www.oasis.security/blog/openclaw-vulnerability)
- [Running OpenClaw safely, Microsoft Security](https://www.microsoft.com/en-us/security/blog/2026/02/19/running-openclaw-safely-identity-isolation-runtime-risk/)
- [OpenClaw security risks, NordLayer](https://nordlayer.com/blog/openclaw-security-risks/) and [Bitsight on exposed instances](https://www.bitsight.com/blog/openclaw-ai-security-risks-exposed-instances)
- [Hermes Agent documentation](https://hermes-agent.nousresearch.com/docs/) and [the project site](https://hermes-agent.org/)
- [Hermes RFC 20708, multi-user permissions, still a draft](https://github.com/NousResearch/hermes-agent/issues/20708)
- [Hermes Agent breakdown, no permissions or audit trail today](https://techjacksolutions.com/ai-tools/hermes/hermes-breakdown/)
- [Open source agent platform comparison 2026](https://jimmysong.io/blog/open-source-ai-agent-workflow-comparison/)
- [Hidden instructions remain the top cause of agent failures, OWASP](https://www.helpnetsecurity.com/2026/06/11/owasp-prompt-injection-ai-security-failures/)
- [The three conditions that make an agent exploitable](https://airia.com/ai-security-in-2026-prompt-injection-the-lethal-trifecta-and-how-to-defend/)
