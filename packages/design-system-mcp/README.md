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

For an interactive setup guide, pick your AI tool in [Storybook](https://wordpress.github.io/gutenberg/?path=/docs/design-system-using-with-ai--docs#setup) to see only the instructions for it.

### Shared configuration

Most clients accept the same `mcpServers` configuration. The sections below say where it goes for each one, and show the full configuration for clients that use a different format.

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

### Claude Code

```bash
claude mcp add wordpress-design-system -- npx -y --ignore-scripts --min-release-age=2 @wordpress/design-system-mcp@latest
```

Start Claude Code and run `/mcp` to confirm `wordpress-design-system` is connected. See the [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp) for more options.

### OpenAI Codex

The [Codex CLI](https://developers.openai.com/codex/cli) must be installed first.

```bash
codex mcp add wordpress-design-system -- npx -y --ignore-scripts --min-release-age=2 @wordpress/design-system-mcp@latest
```

Start Codex and run `/mcp` to confirm `wordpress-design-system` is connected.

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=wordpress-design-system&config=eyJjb21tYW5kIjoibnB4IC15IC0taWdub3JlLXNjcmlwdHMgLS1taW4tcmVsZWFzZS1hZ2U9MiBAd29yZHByZXNzL2Rlc2lnbi1zeXN0ZW0tbWNwQGxhdGVzdCJ9)

Or add the [shared configuration](#shared-configuration) to `~/.cursor/mcp.json`, as described in the [Cursor MCP documentation](https://cursor.com/docs/mcp). Then open Cursor Settings, go to MCP, and confirm `wordpress-design-system` is enabled.

### VS Code

[Install in VS Code](https://vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522wordpress-design-system%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522-y%2522%252C%2522--ignore-scripts%2522%252C%2522--min-release-age%253D2%2522%252C%2522%2540wordpress%252Fdesign-system-mcp%2540latest%2522%255D%257D), or add this to `.vscode/mcp.json`, as described in the [VS Code MCP documentation](https://code.visualstudio.com/docs/agent-customization/mcp-servers#_configure-the-mcpjson-file). VS Code uses `servers` instead of `mcpServers`:

```json
{
	"servers": {
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

Start the server from the MCP view, or from the `MCP: List Servers` command.

### JetBrains

In PhpStorm, WebStorm, or another JetBrains IDE, open Settings, Tools, AI Assistant, [Model Context Protocol (MCP)](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html), and click Add. Paste the [shared configuration](#shared-configuration) into the JSON configuration field, then click OK and Apply. Check that `wordpress-design-system` shows as connected in the Status column.

### Claude Desktop

Open Claude Desktop, then Settings, Developer, and Edit Config. Add the [shared configuration](#shared-configuration) to the `claude_desktop_config.json` file that opens, then quit and reopen Claude Desktop. The [Claude Desktop guide](https://modelcontextprotocol.io/docs/develop/connect-local-servers#installing-the-filesystem-server) shows the same steps for the "filesystem" server.

### Antigravity

Add the [shared configuration](#shared-configuration) to `~/.gemini/config/mcp_config.json`. See the [Antigravity MCP documentation](https://antigravity.google/docs/mcp#getting-started-by-surface) for the App, CLI, and IDE. Antigravity replaces Gemini CLI.

### OpenCode

Add this to `opencode.json`, as described in the [OpenCode MCP documentation](https://opencode.ai/docs/mcp-servers/). OpenCode uses `mcp.servers`, needs `"type": "local"`, and takes the command and its arguments as one `command` array:

```json
{
	"mcp": {
		"servers": {
			"wordpress-design-system": {
				"type": "local",
				"command": [
					"npx",
					"-y",
					"--ignore-scripts",
					"--min-release-age=2",
					"@wordpress/design-system-mcp@latest"
				]
			}
		}
	}
}
```

Restart OpenCode and run `opencode mcp list` to confirm the server is connected.

### Zed

Add this to the Zed `settings.json` file, as described in the [Zed MCP documentation](https://zed.dev/docs/ai/mcp#as-custom-servers). Zed uses `context_servers` instead of `mcpServers`:

```json
{
	"context_servers": {
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

Open the Agent Panel settings and confirm `wordpress-design-system` shows as active.

### Raycast

Run the [Install MCP Server command](https://manual.raycast.com/ai/model-context-protocol) in Raycast and choose Standard Input/Output as the transport. Enter `npx` as the Command and `-y --ignore-scripts --min-release-age=2 @wordpress/design-system-mcp@latest` as the Arguments, then press Install MCP Server.

### Other clients

Add the [shared configuration](#shared-configuration) to your client's MCP configuration (`mcp.json` or equivalent), as described in the [MCP documentation](https://modelcontextprotocol.io/docs/develop/connect-local-servers). Then restart the client so it picks up the new server.

## Importing the package

Most people only need the setup instructions above. To embed the server in your own tooling, install the `@wordpress/design-system-mcp` package from npm:

```bash
npm install @wordpress/design-system-mcp
```

The package is ESM-only and requires Node.js 22.13.0 or newer. It exports `createServer`, which returns a ready-to-connect MCP server, and the `parseComponents` and `parseComponentDetail` helpers. TypeScript consumers that import the package require TypeScript 5 or newer.

## Contributing

The Design System MCP server is published as the `@wordpress/design-system-mcp` package, an individual package that's part of the [Gutenberg project](https://github.com/WordPress/gutenberg). The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/org/wordpress) and used by [WordPress](https://make.wordpress.org/core/) as well as by the broader JavaScript ecosystem.

To find out more about contributing to the Design System MCP server or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).
