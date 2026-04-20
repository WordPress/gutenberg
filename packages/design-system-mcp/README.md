# WordPress Design System MCP

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for the WordPress Design System. Provides AI coding agents with component documentation, prop definitions, usage examples, and design tokens.

## Setup

### Claude Code

```bash
claude mcp add wordpress-design-system -- npx -y --ignore-scripts --min-release-age=2 @wordpress/design-system-mcp@latest
```

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=wordpress-design-system&config=eyJjb21tYW5kIjoibnB4IC15IC0taWdub3JlLXNjcmlwdHMgLS1taW4tcmVsZWFzZS1hZ2U9MiBAd29yZHByZXNzL2Rlc2lnbi1zeXN0ZW0tbWNwQGxhdGVzdCJ9)

Install link: [cursor://anysphere.cursor-deeplink/mcp/install?name=wordpress-design-system&config=eyJjb21tYW5kIjoibnB4IC15IC0taWdub3JlLXNjcmlwdHMgLS1taW4tcmVsZWFzZS1hZ2U9MiBAd29yZHByZXNzL2Rlc2lnbi1zeXN0ZW0tbWNwQGxhdGVzdCJ9](cursor://anysphere.cursor-deeplink/mcp/install?name=wordpress-design-system&config=eyJjb21tYW5kIjoibnB4IC15IC0taWdub3JlLXNjcmlwdHMgLS1taW4tcmVsZWFzZS1hZ2U9MiBAd29yZHByZXNzL2Rlc2lnbi1zeXN0ZW0tbWNwQGxhdGVzdCJ9)

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

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/org/wordpress) and used by [WordPress](https://make.wordpress.org/core/) as well as by the broader JavaScript ecosystem.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).
