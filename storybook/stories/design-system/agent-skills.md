# Agent skills

`@wordpress/theme` and `@wordpress/ui` ship [agent skills](https://agentskills.io/) in their npm packages, so the guidance always matches the installed package version. Each package keeps its skills in `skills/<name>/SKILL.md`:

| Package | Skill | Use it for |
| --- | --- | --- |
| `@wordpress/ui` | `wp-ui` | Creating interfaces: choosing and composing components |
| `@wordpress/ui` | `wp-ui-migration` | Migrating from `@wordpress/components` to `@wordpress/ui` |
| `@wordpress/ui` | `wp-ui-setup` | Setting up a project: styles and the migration ESLint rule |
| `@wordpress/theme` | `wp-theme` | Design tokens, replacing legacy color variables and `ThemeProvider` |
| `@wordpress/theme` | `wp-theme-setup` | Setting up a project: token linters and build-time fallbacks |

Skills complement the [MCP server](?path=/docs/design-system-using-with-ai-mcp--docs), which serves live component and token documentation. Use both for the best results.

Agents only read skills from their own skills directory, such as `.claude/skills` or `.agents/skills`. Your package manager or a helper tool has to link the skills from `node_modules` into that directory. How to do that depends on the package manager.

## pnpm

[pnpm 12.11](https://pnpm.io/blog/releases/12.11.0) or later links skills from your direct dependencies on `pnpm install`. Install the packages as direct dependencies, then approve their skills:

```bash
pnpm add @wordpress/ui @wordpress/theme
pnpm approve
```

pnpm links a package's skills only after you approve them. `pnpm approve` records the approval in `pnpm-workspace.yaml`.

You can also approve the skills ahead of time, for example to share the approval with your team or to set up a project without prompts. Add the packages to the `permissions` setting in `pnpm-workspace.yaml`:

```yaml
permissions:
  '@wordpress/ui':
    skills: true
  '@wordpress/theme':
    skills: true
```

`skills: true` links every skill the package ships, and `false` links none. To approve only some of a package's skills, list their names:

```yaml
permissions:
  '@wordpress/ui':
    skills: [ wp-ui, wp-ui-migration ]
  '@wordpress/theme':
    skills: [ wp-theme ]
```

Skills that are not in the list are not linked, and pnpm does not offer them for approval again.

pnpm links the approved skills into every agent skills directory it detects in your project root, such as `.claude/skills` and `.agents/skills`, plus the one for the agent running pnpm. To control the directories yourself, set `skills.dirs`. It replaces the detected directories, and pnpm creates any that are missing:

```yaml
skills:
  dirs:
    - .ai/skills
    - .agents/skills
```

pnpm writes the links and its `.gitignore` into those directories. If your project tracks one of them in git, or it is a symlink to a tracked folder, point `skills.dirs` at a directory that is not tracked.

See the pnpm documentation on [agent skills](https://pnpm.io/agent-skills) and the settings reference for [`permissions`](https://pnpm.io/settings/build#permissions) and [`skills.dirs`](https://pnpm.io/settings/build#skillsdirs).

## npm

npm does not link skills from dependencies yet. Use the community [`skills` CLI](https://github.com/vercel-labs/skills), which reads your `package.json` dependencies and links their skills into your agent directories:

```bash
npm install @wordpress/ui @wordpress/theme
npm install --save-dev skills
npx skills experimental_sync -y
```

To keep the links current, add the sync to a `prepare` script in your `package.json`:

```json
{
	"scripts": {
		"prepare": "skills experimental_sync -y"
	}
}
```

The command is experimental and may change.

## Yarn

Yarn does not link skills from dependencies yet. With Yarn, use the same `skills` CLI as npm:

```bash
yarn add @wordpress/ui @wordpress/theme
yarn add --dev skills
yarn skills experimental_sync -y
```

Tools that scan `node_modules` can't see packages in Yarn's default Plug'n'Play mode. If the sync finds no skills, set `nodeLinker: node-modules` in `.yarnrc.yml` and run `yarn install` again.

## Check that it worked

Look for the skills from the table above, such as `wp-ui` and `wp-theme`, in your agent's skills directory, for example `.claude/skills`, then start a new agent session.

The links point into `node_modules`, so do not commit them: committed links would be broken until the dependencies are installed.

pnpm adds a `# pnpm` block to a `.gitignore` in each agent skills directory and keeps it up to date, so you don't need to ignore anything for pnpm. pnpm links each skill under its own name, such as `wp-ui`, and only uses the longer `pnpm-<package>-<skill>` name when two skills collide.

For the `skills` CLI (npm and Yarn), add the links to your `.gitignore`. For example, to ignore the `@wordpress/ui` and `@wordpress/theme` skills:

```gitignore
.claude/skills/wp-ui
.claude/skills/wp-ui-migration
.claude/skills/wp-ui-setup
.claude/skills/wp-theme
.claude/skills/wp-theme-setup
.agents/skills/wp-ui
.agents/skills/wp-ui-migration
.agents/skills/wp-ui-setup
.agents/skills/wp-theme
.agents/skills/wp-theme-setup
```

Keep only the lines for the directories you use. The `skills` CLI also writes a `skills-lock.json` file that you should commit.
