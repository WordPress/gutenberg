import { useState } from '@wordpress/element';
import { Markdown, Source, Subheading } from '@storybook/addon-docs/blocks';
import { ButtonLink } from '@wordpress/ui';
import styles from './style.module.css';

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

const CURSOR_URL =
	'https://cursor.com/en-US/install-mcp?name=wordpress-design-system&config=eyJjb21tYW5kIjoibnB4IC15IC0taWdub3JlLXNjcmlwdHMgLS1taW4tcmVsZWFzZS1hZ2U9MiBAd29yZHByZXNzL2Rlc2lnbi1zeXN0ZW0tbWNwQGxhdGVzdCJ9';

type Link = {
	href: string;
	label: string;
	/** Official badge image to show instead of the styled button. */
	image?: string;
};

type Tool = {
	id: string;
	label: string;
	/** Domain whose favicon is used as the logo. */
	domain?: string;
	/** Fallback badge for tools without a favicon. */
	mark: string;
	color: string;
	/** File the configuration belongs in, shown above the code block. */
	file?: string;
	command?: string;
	config?: string;
	install?: Link;
	link?: Link;
	steps: string[];
};

const CLI_ARGS = `wordpress-design-system -- npx ${ PACKAGE_ARGS.join( ' ' ) }`;

const RESTART = 'Restart the tool so it picks up the new server.';

const TOOLS: Tool[] = [
	{
		id: 'claude-code',
		label: 'Claude Code',
		domain: 'claude.ai',
		mark: 'CC',
		color: '#d97757',
		command: `claude mcp add ${ CLI_ARGS }`,
		link: {
			href: 'https://code.claude.com/docs/en/mcp',
			label: 'Claude Code MCP documentation',
		},
		steps: [
			'Open a terminal and run the command above.',
			'Start Claude Code and run `/mcp` to confirm `wordpress-design-system` is connected.',
		],
	},
	{
		id: 'codex',
		label: 'OpenAI Codex',
		domain: 'openai.com',
		mark: 'Cx',
		color: '#10a37f',
		command: `codex mcp add ${ CLI_ARGS }`,
		link: {
			href: 'https://developers.openai.com/codex/cli',
			label: 'Codex CLI documentation',
		},
		steps: [
			'Install the Codex CLI if you have not already.',
			'Open a terminal and run the command above.',
			'Start Codex and run `/mcp` to confirm `wordpress-design-system` is connected.',
		],
	},
	{
		id: 'cursor',
		label: 'Cursor',
		domain: 'cursor.com',
		mark: 'Cu',
		color: '#1f2937',
		file: '~/.cursor/mcp.json',
		config: JSON_CONFIG,
		install: {
			href: CURSOR_URL,
			label: 'Add to Cursor',
			image: 'https://cursor.com/deeplink/mcp-install-dark.svg',
		},
		link: {
			href: 'https://cursor.com/docs/mcp',
			label: 'Cursor MCP documentation',
		},
		steps: [
			'Click “Add to Cursor”, or add the configuration above to your Cursor MCP settings.',
			'Open Cursor Settings, go to MCP, and confirm `wordpress-design-system` is enabled.',
		],
	},
	{
		id: 'vscode',
		label: 'VS Code',
		domain: 'code.visualstudio.com',
		mark: 'VS',
		color: '#0078d4',
		file: '.vscode/mcp.json',
		config: toJson( { servers: { [ SERVER_NAME ]: SERVER_ENTRY } } ),
		install: { href: VSCODE_URL, label: 'Install in VS Code' },
		link: {
			href: 'https://code.visualstudio.com/docs/agent-customization/mcp-servers#_configure-the-mcpjson-file',
			label: 'VS Code MCP configuration guide',
		},
		steps: [
			'Click “Install in VS Code”, or add the configuration above to your `mcp.json` file.',
			'Start the server from the MCP view, or from the `MCP: List Servers` command.',
		],
	},
	{
		id: 'jetbrains',
		label: 'JetBrains',
		domain: 'jetbrains.com',
		mark: 'JB',
		color: '#000000',
		config: JSON_CONFIG,
		link: {
			href: 'https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html',
			label: 'JetBrains AI Assistant MCP guide',
		},
		steps: [
			'In PhpStorm or another JetBrains IDE, open Settings, Tools, AI Assistant, Model Context Protocol (MCP), and click Add.',
			'Paste the configuration above into the JSON configuration field, then click OK and Apply.',
			'Check that `wordpress-design-system` shows as connected in the Status column.',
		],
	},
	{
		id: 'claude-desktop',
		label: 'Claude Desktop',
		domain: 'anthropic.com',
		mark: 'CD',
		color: '#c15f3c',
		file: 'claude_desktop_config.json',
		config: JSON_CONFIG,
		link: {
			href: 'https://modelcontextprotocol.io/docs/develop/connect-local-servers#installing-the-filesystem-server',
			label: 'Claude Desktop guide (substitute the entry above for the filesystem server)',
		},
		steps: [
			'Open Claude Desktop, then Settings, Developer, and Edit Config.',
			'Add the configuration above to the file that opens.',
			'Quit and reopen Claude Desktop.',
		],
	},
	{
		id: 'antigravity',
		label: 'Antigravity',
		domain: 'antigravity.google',
		mark: 'Ag',
		color: '#4285f4',
		file: '~/.gemini/config/mcp_config.json',
		config: JSON_CONFIG,
		steps: [
			'See the [MCP installation instructions](https://antigravity.google/docs/mcp#getting-started-by-surface).',
			'Or alternatively, prompt your agent to add the MCP configuration above.',
		],
	},
	{
		id: 'opencode',
		label: 'OpenCode',
		domain: 'opencode.ai',
		mark: 'Oc',
		color: '#211e1e',
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
		link: {
			href: 'https://opencode.ai/docs/mcp-servers/',
			label: 'OpenCode MCP documentation',
		},
		steps: [
			'Add the configuration above to the file.',
			'Restart OpenCode and run `opencode mcp list` to confirm the server is connected.',
		],
	},
	{
		id: 'zed',
		label: 'Zed',
		domain: 'zed.dev',
		mark: 'Zd',
		color: '#084ccf',
		file: 'settings.json',
		config: toJson( {
			context_servers: { [ SERVER_NAME ]: SERVER_ENTRY },
		} ),
		link: {
			href: 'https://zed.dev/docs/ai/mcp',
			label: 'Zed MCP documentation',
		},
		steps: [
			'Open the Zed settings file and add the configuration above.',
			'Open the Agent Panel settings and confirm `wordpress-design-system` shows as active.',
		],
	},
	{
		id: 'raycast',
		label: 'Raycast',
		domain: 'raycast.com',
		mark: 'Rc',
		color: '#ff6363',
		config: toJson( SERVER_ENTRY ),
		install: { href: RAYCAST_URL, label: 'Install in Raycast' },
		link: {
			href: 'https://manual.raycast.com/ai/model-context-protocol',
			label: 'Raycast MCP documentation',
		},
		steps: [
			'Click “Install in Raycast”, or run the “Install MCP Server” command in Raycast and choose Standard Input/Output as the transport.',
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
		link: {
			href: 'https://modelcontextprotocol.io/docs/develop/connect-local-servers',
			label: 'Model Context Protocol: connect to local servers',
		},
		steps: [
			'Add the configuration above to your MCP client’s configuration (`mcp.json` or equivalent).',
			RESTART,
		],
	},
];

function ToolIcon( { tool }: { tool: Tool } ) {
	if ( ! tool.domain ) {
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
			src={ `https://www.google.com/s2/favicons?domain=${ tool.domain }&sz=64` }
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
			<p className={ styles.hint }>Pick your AI tool.</p>
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
				{ tool.link && (
					<p>
						<a
							href={ tool.link.href }
							target="_blank"
							rel="noreferrer"
						>
							{ tool.link.label }
						</a>
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
