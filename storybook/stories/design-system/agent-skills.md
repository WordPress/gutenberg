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

pnpm 12.11 and later link skills from your direct dependencies on `pnpm install`. Install the packages as direct dependencies, then approve their skills:

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

`skills: true` links every skill the package ships. A list of skill names, such as `skills: [ wp-ui ]`, links only those skills, and `false` links none.

By default, pnpm links skills into the agent skills directories that already exist in your project root, plus the one for the agent running pnpm. To choose the directories yourself, set `skills.dirs`. This replaces the detected directories and creates any that are missing:

```yaml
skills:
  dirs:
    - .claude/skills
```

See the pnpm settings reference for [`permissions`](https://pnpm.io/settings/build#permissions) and [`skills.dirs`](https://pnpm.io/settings/build#skillsdirs).

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

Commit the links, or ignore them in `.gitignore` if your team prefers to link the skills again on every install. For example, to ignore the `@wordpress/ui` and `@wordpress/theme` skills:

```gitignore
# pnpm names each link pnpm-<package>-<skill>, so this also ignores skills from other @wordpress packages.
.claude/skills/pnpm-*wordpress*
.agents/skills/pnpm-*wordpress*

# The skills CLI (npm and Yarn) names each link after the skill.
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

Keep only the lines for the directories and tool you use. The `skills` CLI also writes a `skills-lock.json` file that you should commit.
