/**
 * Competitor comparison data. Mirrors marketing/competitor-comparison.md.
 * Researched 27 July 2026 from vendor documentation and public reporting;
 * re-check before a release, this category moves fast.
 *
 * Every mark carries a `note` so the reasoning is on the page rather than in
 * someone's head. The notes surface behind the info button on each row.
 */

export type Mark = 'yes' | 'part' | 'no'

export type Vendor = {
  id: string
  name: string
  /** Shown under the name in the header. Keep it to a few words. */
  kind: string
  /** Logo path — greyed out for competitors, full-colour for AgentZ */
  logo?: string
  /** Two-letter monogram fallback when no logo exists */
  mono?: string
}

export const VENDORS: Vendor[] = [
  { id: 'agentz',    name: 'AgentZ',      kind: 'Zero Trust platform',   logo: './assets/img/agentz-logo.svg' },
  { id: 'langgraph', name: 'LangGraph',   kind: 'Framework + platform',  logo: './assets/img/logos/langgraph.webp' },
  { id: 'crewai',    name: 'CrewAI AMP',  kind: 'Multi-agent platform',  logo: './assets/img/logos/crewai.svg' },
  { id: 'microsoft', name: 'Microsoft',   kind: 'Foundry Agents',        logo: './assets/img/logos/microsoft.svg' },
  { id: 'aws',       name: 'AWS',         kind: 'Bedrock AgentCore',     logo: './assets/img/logos/aws.svg' },
  { id: 'openclaw',  name: 'OpenClaw',    kind: 'Free, self-hosted',     logo: './assets/img/logos/openclaw.webp' },
  { id: 'hermes',    name: 'Hermes',      kind: 'Free, self-hosted',     logo: './assets/img/logos/hermes.webp' },
  { id: 'n8n',       name: 'n8n',         kind: 'Free, self-hosted',     logo: './assets/img/logos/n8n.svg' },
]

export type Row = {
  /** The industry term for the capability. The headline. */
  label: string
  /** The same thing in a buyer's words, shown in brackets after the label. */
  term: string
  /** The full plain-English reading. Surfaces on the row's info button. */
  plain: string
  cells: Record<string, { mark: Mark; note: string }>
}

const y = (note: string) => ({ mark: 'yes' as const, note })
const p = (note: string) => ({ mark: 'part' as const, note })
const n = (note: string) => ({ mark: 'no' as const, note })

export const ROWS: Row[] = [
  {
    label: 'Zero trust, default deny',
    term: 'safe on day one',
    plain: 'Nothing is allowed until you allow it. You do not have to configure anything to be safe on the first run.',
    cells: {
      agentz: y('Every action is checked against policy before it runs.'),
      langgraph: n('Open by default. Security is entirely your own work.'),
      crewai: p('Available on the business tier, configured separately.'),
      microsoft: p('Guardrails apply per tenant, not per action.'),
      aws: p('Scoped through IAM policies that you write and maintain.'),
      openclaw: n('Ships wide open. Credentials sit on disk in plain text.'),
      hermes: p('Asks before each tool call and hardens its container.'),
      n8n: n('Open by default. Security is entirely your own work.'),
    },
  },
  {
    label: 'Network egress control',
    term: 'you choose where it can go online',
    plain: 'You list the places the agent is allowed to reach. Anything else is refused, so it cannot quietly send your data somewhere else.',
    cells: {
      agentz: y('Allowed by domain, port and protocol, and recorded.'),
      langgraph: n('No outbound controls.'),
      crewai: n('No outbound controls.'),
      microsoft: p('Network isolation available, configured per deployment.'),
      aws: p('Only in VPC mode. The default sandbox has been escaped twice publicly.'),
      openclaw: n('Reaches the whole internet, your files and your shell.'),
      hermes: p('Container isolation, but no allow-list of destinations.'),
      n8n: n('No outbound controls.'),
    },
  },
  {
    label: 'Zero secret exposure',
    term: 'the agent never sees your passwords',
    plain: 'Keys stay locked away. The platform makes the call for the agent, so a hijacked agent has no password to steal.',
    cells: {
      agentz: y('Secrets stay in the vault. The agent never holds the key.'),
      langgraph: n('Keys are handed to the agent as environment variables.'),
      crewai: p('A secrets manager stores them, the agent still reads them.'),
      microsoft: p('Key Vault stores them, the agent still reads them.'),
      aws: p('AgentCore Identity brokers OAuth, other keys still reach the agent.'),
      openclaw: n('Saved to disk in plain text. Some setups sent them unencrypted.'),
      hermes: p('Kept in config the agent process can read.'),
      n8n: n('Keys are handed to the workflow as environment variables.'),
    },
  },
  {
    label: 'Fine-grained access control',
    term: 'permission for each individual action',
    plain: 'You allow a specific action, not a whole connection. Reading a file and deleting one are separate decisions.',
    cells: {
      agentz: y('Permissions are set per tool call.'),
      langgraph: p('Access is granted per workspace.'),
      crewai: p('Access is granted per project.'),
      microsoft: p('Access is granted per agent.'),
      aws: p('Access is granted per IAM role.'),
      openclaw: n('One user, full access to everything on the machine.'),
      hermes: p('Prompts you per tool. Multi-user permissions are a draft proposal.'),
      n8n: p('Access is granted per workflow.'),
    },
  },
  {
    label: 'Tamper-evident audit trail',
    term: 'a record that cannot be edited',
    plain: 'Every step is signed as it happens, so you can prove later what the agent actually did. Useful when an auditor asks.',
    cells: {
      agentz: y('Signed and replayable, down to the token.'),
      langgraph: p('Traces are captured but not signed.'),
      crewai: p('Audit logs, editable by an administrator.'),
      microsoft: p('Activity logs, editable by an administrator.'),
      aws: p('CloudTrail records API calls, not agent reasoning.'),
      openclaw: n('Local logs only.'),
      hermes: n('No audit logging today.'),
      n8n: n('Execution history only.'),
    },
  },
  {
    label: 'Multi-user and roles',
    term: 'built for a team, not one person',
    plain: 'Several people share the same agents with different levels of access, and you can see who did what.',
    cells: {
      agentz: y('Roles, teams and shared context are built in.'),
      langgraph: p('Workspaces on the paid tiers.'),
      crewai: y('Single sign-on and roles on the business tier.'),
      microsoft: y('Uses your existing Microsoft directory.'),
      aws: y('Uses your existing AWS accounts and roles.'),
      openclaw: n('Designed for one person on one machine.'),
      hermes: n('Single user. Multi-user access is a draft proposal.'),
      n8n: p('Team features on the paid tiers.'),
    },
  },
  {
    label: 'On-premises',
    term: 'runs on your own servers',
    plain: 'The whole thing runs on hardware you control, so your data never leaves your building.',
    cells: {
      agentz: y('Same product, your infrastructure.'),
      langgraph: p('Enterprise tier only, priced on request.'),
      crewai: y('Private infrastructure through AMP Factory.'),
      microsoft: p('Only by switching to Foundry Local, a smaller product.'),
      aws: n('No on-premises option.'),
      openclaw: y('Local-first by design.'),
      hermes: y('Install on your own hardware.'),
      n8n: y('Self-hosting is the normal way to run it.'),
    },
  },
  {
    label: 'Air-gapped',
    term: 'runs with no internet at all',
    plain: 'Works in a room with no connection to the outside world. Usually a hard requirement in defence, government and healthcare.',
    cells: {
      agentz: y('Supported as a first-class deployment.'),
      langgraph: n('Requires a connection.'),
      crewai: p('Private network, still expects some connectivity.'),
      microsoft: p('Only through Foundry Local on Azure Local.'),
      aws: n('Cloud only.'),
      openclaw: p('Possible with a local model, entirely your own work.'),
      hermes: y('Runs fully offline with local models.'),
      n8n: p('Possible, entirely your own work.'),
    },
  },
  {
    label: 'Model agnostic',
    term: 'any AI model, on your own account',
    plain: 'Bring the model you already pay for, and swap it later without rebuilding your agents.',
    cells: {
      agentz: y('Any provider or open source, on your own key.'),
      langgraph: y('Any provider.'),
      crewai: y('Any provider.'),
      microsoft: p('Limited to the Azure model catalogue.'),
      aws: p('Limited to the Bedrock model catalogue.'),
      openclaw: y('Any provider, including local models.'),
      hermes: y('Hundreds of models, including local ones.'),
      n8n: y('Any provider.'),
    },
  },
  {
    label: 'Inference pricing and pool picking',
    term: 'see and control what the AI costs',
    plain: 'Choose which group of models a job runs against, and see the price of each run before the bill arrives.',
    cells: {
      agentz: y('Pick the pool, see the price per run.'),
      langgraph: n('Billed per step executed, no model cost control.'),
      crewai: n('Not offered.'),
      microsoft: n('Not offered.'),
      aws: n('Not offered.'),
      openclaw: n('Not offered.'),
      hermes: n('Not offered.'),
      n8n: n('Not offered.'),
    },
  },
  {
    label: 'Dynamic skill creation',
    term: 'describe a job, it builds it',
    plain: 'Say what you want in a sentence and the platform writes the steps. No code needed to get started.',
    cells: {
      agentz: y('Describe the job, AgentZ writes the skill and wires the steps.'),
      langgraph: n('You write the graph yourself.'),
      crewai: n('You write the crew yourself.'),
      microsoft: p('Prompt templates, not generated skills.'),
      aws: n('You write the code yourself.'),
      openclaw: p('Community skills exist. Roughly one in four has a security hole.'),
      hermes: y('Genuinely builds reusable skills from its own experience.'),
      n8n: n('You wire the nodes yourself.'),
    },
  },
  {
    label: 'Single control plane',
    term: 'one place for agents, models and people',
    plain: 'Agents, the models they use, who is allowed to run them and the record of what happened, all in one screen.',
    cells: {
      agentz: y('Skills, workflows, context, guardrails and audit together.'),
      langgraph: p('Agents only. Models and people live elsewhere.'),
      crewai: p('Agents only. Models and people live elsewhere.'),
      microsoft: p('Only within the Microsoft estate.'),
      aws: p('Only within the AWS estate.'),
      openclaw: n('One agent on one machine.'),
      hermes: n('One agent on one machine.'),
      n8n: n('Workflows only.'),
    },
  },
  {
    label: 'Commercial support',
    term: 'somebody to call when it breaks',
    plain: 'A vendor with a support contract and an obligation to fix it, rather than an issue tracker and hope.',
    cells: {
      agentz: y('Backed by AccuKnox.'),
      langgraph: y('Support on the paid tiers.'),
      crewai: y('Support on the business tier.'),
      microsoft: y('Standard Microsoft support.'),
      aws: y('Standard AWS support.'),
      openclaw: n('Community only.'),
      hermes: n('Community only.'),
      n8n: p('Support on the paid tiers.'),
    },
  },
]
