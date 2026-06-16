# WordPress Design System MCP Server

<p class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</p>

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for the WordPress Design System. Provides AI agents with component documentation, usage examples, and design tokens.

By using the MCP server, you can be confident that your AI agents are correctly following the latest design system guidance when asking questions like:

-   Which components should be used for a given interaction or user interface, like a button or a dropdown
-   How to implement those components in code, following sample code from the design system documentation
-   How to implement new components following the design system styling standards with design tokens

Without the MCP server, an AI agent may produce a functional and convincing result, but there's a higher risk that its resources are out-of-date or inaccurate, and it may try to use components which are no longer recommended for use. Since AI agents are unable to read [the WordPress Gutenberg Storybook documentation](https://wordpress.github.io/gutenberg/), the MCP server provides an alternative, machine-readable interface to that same information.

## Setup

### Claude Code

```bash
claude mcp add wordpress-design-system -- npx -y --ignore-scripts --min-release-age=2 @wordpress/design-system-mcp@latest
```

### OpenAI Codex

```bash
codex mcp add wordpress-design-system -- npx -y --ignore-scripts --min-release-age=2 @wordpress/design-system-mcp@latest
```

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=wordpress-design-system&config=eyJjb21tYW5kIjoibnB4IC15IC0taWdub3JlLXNjcmlwdHMgLS1taW4tcmVsZWFzZS1hZ2U9MiBAd29yZHByZXNzL2Rlc2lnbi1zeXN0ZW0tbWNwQGxhdGVzdCJ9)

### Other (Claude Desktop, VS Code)

Add to your MCP client configuration (`mcp.json` or equivalent):

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

Configuration instructions for common clients:

-   [VSCode](https://code.visualstudio.com/docs/agent-customization/mcp-servers#_configure-the-mcpjson-file)
-   [Claude Desktop](https://modelcontextprotocol.io/docs/develop/connect-local-servers#installing-the-filesystem-server)
    -   This guide is for the "filesystem" server, but you can substitute the `mcpServers` entry from the snippet above and the rest of the instructions still apply.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/org/wordpress) and used by [WordPress](https://make.wordpress.org/core/) as well as by the broader JavaScript ecosystem.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).
