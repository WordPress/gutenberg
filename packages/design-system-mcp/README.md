# WordPress Design System MCP Server

<p class="callout callout-alert">
The Design System MCP server is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</p>

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for the WordPress Design System. Provides AI agents with component documentation, usage examples, and design tokens.

By using the MCP server, you can be confident that your AI agents are correctly following the latest design system guidance when asking questions like:

- Which components should be used for a given interaction or user interface, like a button or a dropdown
- How to implement those components in code, following sample code from the design system documentation
- How to implement new components following the design system styling standards with design tokens
- How to compose those components into an interaction, following the design system patterns, like confirming a destructive action or wording an error message

Without the MCP server, an AI agent may produce a functional and convincing result, but there's a higher risk that its resources are out-of-date or inaccurate, and it may try to use components which are no longer recommended for use. Since AI agents are unable to read [the WordPress Gutenberg Storybook documentation](https://wordpress.github.io/gutenberg/), the MCP server provides an alternative, machine-readable interface to that same information.

## Setup

### Claude Code

```bash
claude mcp add wordpress-design-system -- npx -y --ignore-scripts --min-release-age=2 @wordpress/design-system-mcp@latest
```

### OpenAI Codex

The [Codex CLI](https://developers.openai.com/codex/cli) must be installed first.

```bash
codex mcp add wordpress-design-system -- npx -y --ignore-scripts --min-release-age=2 @wordpress/design-system-mcp@latest
```

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=wordpress-design-system&config=eyJjb21tYW5kIjoibnB4IC15IC0taWdub3JlLXNjcmlwdHMgLS1taW4tcmVsZWFzZS1hZ2U9MiBAd29yZHByZXNzL2Rlc2lnbi1zeXN0ZW0tbWNwQGxhdGVzdCJ9)

### Other clients

Most clients accept the same `mcpServers` configuration:

```json
{
	"mcpServers": {
		"wordpress-design-system": {
			"command": "npx",
			"args": [
				"-y",
				"--ignore-scripts",
				"--min-release-age=2",
				"@wordpress/design-system-mcp@latest"
			]
		}
	}
}
```

Where it goes, and what changes for each client:

| Client | Where | Notes |
| --- | --- | --- |
| [Claude Desktop](https://modelcontextprotocol.io/docs/develop/connect-local-servers#installing-the-filesystem-server) | `claude_desktop_config.json` (Settings, Developer, Edit Config) | Restart the app. The guide is for the "filesystem" server, so substitute the entry above. |
| [VS Code](https://code.visualstudio.com/docs/agent-customization/mcp-servers#_configure-the-mcpjson-file) | `.vscode/mcp.json`, or [install in VS Code](https://vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522wordpress-design-system%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522-y%2522%252C%2522--ignore-scripts%2522%252C%2522--min-release-age%253D2%2522%252C%2522%2540wordpress%252Fdesign-system-mcp%2540latest%2522%255D%257D) | Use `servers` instead of `mcpServers`. |
| [JetBrains](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) | Settings, Tools, AI Assistant, Model Context Protocol (MCP), Add | Paste it into the JSON configuration field. |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md) | `~/.gemini/settings.json` | |
| [Zed](https://zed.dev/docs/ai/mcp) | `settings.json` | Use `context_servers` instead of `mcpServers`. |
| [OpenCode](https://opencode.ai/docs/mcp-servers/) | `opencode.json` | Use `mcp.servers`, add `"type": "local"`, and join `command` and `args` into one `command` array. |
| Raycast | [Install in Raycast](raycast://mcp/install?%7B%22name%22%3A%22wordpress-design-system%22%2C%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22--ignore-scripts%22%2C%22--min-release-age%3D2%22%2C%22%40wordpress%2Fdesign-system-mcp%40latest%22%5D%7D), or the "Install Server" command | For the command, paste only the server entry, the object holding `command` and `args`. |

## Importing the package

Most people only need the setup instructions above. To embed the server in your own tooling, install the `@wordpress/design-system-mcp` package from npm:

```bash
npm install @wordpress/design-system-mcp
```

The package is ESM-only and requires Node.js 22.13.0 or newer. It exports `createServer`, which returns a ready-to-connect MCP server, and the `parseComponents` and `parseComponentDetail` helpers. TypeScript consumers that import the package require TypeScript 5 or newer.

## Contributing

The Design System MCP server is published as the `@wordpress/design-system-mcp` package, an individual package that's part of the [Gutenberg project](https://github.com/WordPress/gutenberg). The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/org/wordpress) and used by [WordPress](https://make.wordpress.org/core/) as well as by the broader JavaScript ecosystem.

To find out more about contributing to the Design System MCP server or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).
