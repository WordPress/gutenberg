import { useState } from '@wordpress/element';
import { Markdown, Source, Subheading } from '@storybook/addon-docs/blocks';
import { ButtonLink } from '@wordpress/ui';
import styles from './style.module.css';
import anthropicLogo from './logos/anthropic.svg';
import antigravityLogo from './logos/antigravity.svg';
import claudeCodeLogo from './logos/claude-code.svg';
import cursorLogo from './logos/cursor.svg';
import jetbrainsLogo from './logos/jetbrains.svg';
import openaiLogo from './logos/openai.svg';
import opencodeLogo from './logos/opencode.svg';
import raycastLogo from './logos/raycast.svg';
import vscodeLogo from './logos/vscode.svg';
import zedLogo from './logos/zed.svg';

const PACKAGE_ARGS = [
	'-y',
	'--ignore-scripts',
	'--min-release-age=2',
	'@wordpress/design-system-mcp@latest',
];

const SERVER_NAME = 'wordpress-design-system';

const SERVER_ENTRY = { command: 'npx', args: PACKAGE_ARGS };

const toJson = ( value: unknown ) => JSON.stringify( value, null, 2 );

const JSON_CONFIG = toJson( { mcpServers: { [ SERVER_NAME ]: SERVER_ENTRY } } );

const VSCODE_URL = `vscode:mcp/install?${ encodeURIComponent(
	JSON.stringify( { name: SERVER_NAME, ...SERVER_ENTRY } )
) }`;

const RAYCAST_URL = `raycast://mcp/install?${ encodeURIComponent(
	JSON.stringify( { name: SERVER_NAME, type: 'stdio', ...SERVER_ENTRY } )
) }`;

const CURSOR_URL = `https://cursor.com/en-US/install-mcp?name=${ SERVER_NAME }&config=${ btoa(
        JSON.stringify( { command: [ 'npx', ...PACKAGE_ARGS ].join( ' ' ) } )
) }`;

type Link = {
	href: string;
	label: string;
	/** Official badge image to show instead of the styled button. */
	image?: string;
};

type ToolBase = {
	id: string;
	label: string;
	/** File the configuration belongs in, shown above the code block. */
	file?: string;
	command?: string;
	config?: string;
	install?: Link;
	steps: string[];
};

/** A tool shows either its logo (an SVG file) or a text badge (`mark` and `color`). */
type Tool = ToolBase &
	(
		| { logo: string; mark?: never; color?: never }
		| { logo?: never; mark: string; color: string }
	);

const CLI_ARGS = `wordpress-design-system -- npx ${ PACKAGE_ARGS.join( ' ' ) }`;

const RESTART = 'Restart the tool so it picks up the new server.';

const TOOLS: Tool[] = [
	{
		id: 'claude-code',
		label: 'Claude Code',
		logo: claudeCodeLogo,
		command: `claude mcp add ${ CLI_ARGS }`,
		steps: [
			'Open a terminal and run the command above. See the [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp) for more options.',
			'Start Claude Code and run `/mcp` to confirm `wordpress-design-system` is connected.',
		],
	},
	{
		id: 'codex',
		label: 'OpenAI Codex',
		logo: openaiLogo,
		command: `codex mcp add ${ CLI_ARGS }`,
		steps: [
			'Install the [Codex CLI](https://developers.openai.com/codex/cli) if you have not already.',
			'Open a terminal and run the command above.',
			'Start Codex and run `/mcp` to confirm `wordpress-design-system` is connected.',
		],
	},
	{
		id: 'cursor',
		label: 'Cursor',
		logo: cursorLogo,
		file: '~/.cursor/mcp.json',
		config: JSON_CONFIG,
		install: {
			href: CURSOR_URL,
			label: 'Add to Cursor',
			image: 'https://cursor.com/deeplink/mcp-install-dark.svg',
		},
		steps: [
			'Click “Add to Cursor”, or add the configuration above to your Cursor [MCP settings](https://cursor.com/docs/mcp).',
			'Open Cursor Settings, go to MCP, and confirm `wordpress-design-system` is enabled.',
		],
	},
	{
		id: 'vscode',
		label: 'VS Code',
		logo: vscodeLogo,
		file: '.vscode/mcp.json',
		config: toJson( { servers: { [ SERVER_NAME ]: SERVER_ENTRY } } ),
		install: { href: VSCODE_URL, label: 'Install in VS Code' },
		steps: [
			'Click “Install in VS Code”, or add the configuration above to your [`mcp.json` file](https://code.visualstudio.com/docs/agent-customization/mcp-servers#_configure-the-mcpjson-file).',
			'Start the server from the MCP view, or from the `MCP: List Servers` command.',
		],
	},
	{
		id: 'jetbrains',
		label: 'JetBrains',
		logo: jetbrainsLogo,
		config: JSON_CONFIG,
		steps: [
			'In PhpStorm or another JetBrains IDE, open Settings, Tools, AI Assistant, [Model Context Protocol (MCP)](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html), and click Add.',
			'Paste the configuration above into the JSON configuration field, then click OK and Apply.',
			'Check that `wordpress-design-system` shows as connected in the Status column.',
		],
	},
	{
		id: 'claude-desktop',
		label: 'Claude Desktop',
		logo: anthropicLogo,
		file: 'claude_desktop_config.json',
		config: JSON_CONFIG,
		steps: [
			'Open Claude Desktop, then Settings, Developer, and Edit Config. The [Claude Desktop guide](https://modelcontextprotocol.io/docs/develop/connect-local-servers#installing-the-filesystem-server) shows the same steps for the filesystem server.',
			'Add the configuration above to the file that opens.',
			'Quit and reopen Claude Desktop.',
		],
	},
	{
		id: 'antigravity',
		label: 'Antigravity',
		logo: antigravityLogo,
		file: '~/.gemini/config/mcp_config.json',
		config: JSON_CONFIG,
		steps: [
			'See the [MCP installation instructions](https://antigravity.google/docs/mcp#getting-started-by-surface) for the Antigravity App, CLI, and IDE, or prompt your agent to add the MCP configuration above.',
		],
	},
	{
		id: 'opencode',
		label: 'OpenCode',
		logo: opencodeLogo,
		file: 'opencode.json',
		config: toJson( {
			mcp: {
				servers: {
					[ SERVER_NAME ]: {
						type: 'local',
						command: [ 'npx', ...PACKAGE_ARGS ],
					},
				},
			},
		} ),
		steps: [
			'Add the configuration above to the file, as described in the [OpenCode MCP documentation](https://opencode.ai/docs/mcp-servers/).',
			'Restart OpenCode and run `opencode mcp list` to confirm the server is connected.',
		],
	},
	{
		id: 'zed',
		label: 'Zed',
		logo: zedLogo,
		file: 'settings.json',
		config: toJson( {
			context_servers: { [ SERVER_NAME ]: SERVER_ENTRY },
		} ),
		steps: [
			'Open the Zed settings file and add the configuration above, as described in the [Zed MCP documentation](https://zed.dev/docs/ai/mcp#as-custom-servers).',
			'Open the Agent Panel settings and confirm `wordpress-design-system` shows as active.',
		],
	},
	{
		id: 'raycast',
		label: 'Raycast',
		logo: raycastLogo,
		config: toJson( SERVER_ENTRY ),
		install: { href: RAYCAST_URL, label: 'Install in Raycast' },
		steps: [
			'Click “Install in Raycast”, or run the [“Install MCP Server” command](https://manual.raycast.com/ai/model-context-protocol) in Raycast and choose Standard Input/Output as the transport.',
			'If you filled in the form yourself, enter `command` from the configuration above as the Command and `args` as the Arguments, then press Install MCP Server.',
		],
	},
	{
		id: 'other',
		label: 'Other',
		mark: '{}',
		color: '#6b7280',
		file: 'mcp.json',
		config: JSON_CONFIG,
		steps: [
			'Add the configuration above to your MCP client’s configuration (`mcp.json` or equivalent), as described in the [MCP documentation](https://modelcontextprotocol.io/docs/develop/connect-local-servers).',
			RESTART,
		],
	},
];

function ToolIcon( { tool }: { tool: Tool } ) {
	if ( ! tool.logo ) {
		return (
			<span
				className={ styles.mark }
				style={ { background: tool.color } }
				aria-hidden="true"
			>
				{ tool.mark }
			</span>
		);
	}
	return (
		<img
			className={ styles.logo }
			src={ tool.logo }
			alt=""
			width={ 32 }
			height={ 32 }
		/>
	);
}

const MARKDOWN_OPTIONS = {
	forceInline: true,
	overrides: {
		a: { props: { target: '_blank', rel: 'noreferrer' } },
	},
};

export function InstallGrid() {
	const [ selected, setSelected ] = useState( TOOLS[ 0 ].id );
	const tool = TOOLS.find( ( t ) => t.id === selected ) ?? TOOLS[ 0 ];

	return (
		<div className={ styles.root }>
			<div
				className={ styles.tiles }
				role="radiogroup"
				aria-label="AI tool"
			>
				{ TOOLS.map( ( t ) => (
					<button
						key={ t.id }
						type="button"
						role="radio"
						aria-checked={ t.id === selected }
						className={ styles.tile }
						onClick={ () => setSelected( t.id ) }
					>
						<ToolIcon tool={ t } />
						{ t.label }
					</button>
				) ) }
			</div>
			<div className={ styles.panel } role="group" aria-live="polite">
				<Subheading>{ tool.label }</Subheading>
				{ tool.command && (
					<Source
						code={ tool.command }
						language="bash"
						format={ false }
					/>
				) }
				{ tool.config && (
					<>
						{ tool.file && (
							<p className={ styles.file }>
								In <code>{ tool.file }</code>:
							</p>
						) }
						<Source
							code={ tool.config }
							language="json"
							format={ false }
						/>
					</>
				) }
				{ tool.install && (
					<p>
						{ tool.install.image ? (
							<a href={ tool.install.href }>
								<img
									src={ tool.install.image }
									alt={ tool.install.label }
									height={ 32 }
								/>
							</a>
						) : (
							<ButtonLink
								className={ styles.install }
								href={ tool.install.href }
								variant="solid"
								tone="brand"
								size="compact"
							>
								{ tool.install.label }
							</ButtonLink>
						) }
					</p>
				) }
				<ol className={ styles.steps }>
					{ tool.steps.map( ( step ) => (
						<li key={ step }>
							<Markdown options={ MARKDOWN_OPTIONS }>
								{ step }
							</Markdown>
						</li>
					) ) }
				</ol>
			</div>
		</div>
	);
}
