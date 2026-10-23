import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import {
	createInterpolateElement,
	useMemo,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Link } from '@wordpress/ui';
import type { PluginStatus } from './use-connector-plugin';

const MCP_PLUGIN_SLUG = 'mcp-adapter';
const MCP_PLUGIN_ID = 'mcp-adapter/mcp-adapter';
const MCP_PLUGIN_URL = 'https://wordpress.org/plugins/mcp-adapter/';
const MCP_DEFAULT_ROUTE = 'mcp/mcp-adapter-default-server';

type Busy = false | 'installing' | 'activating' | 'deactivating';

type McpAccessData = {
	allowAgents: boolean;
	endpoint: string;
};

export function McpAccessPanel() {
	const [ busy, setBusy ] = useState< Busy >( false );

	const { pluginStatus, canInstallPlugins, siteUrl } = useSelect(
		( select ) => {
			const store = select( coreStore );
			const plugin = store.getEntityRecord(
				'root',
				'plugin',
				MCP_PLUGIN_ID
			) as { status: string } | undefined;
			const hasFinished = store.hasFinishedResolution(
				'getEntityRecord',
				[ 'root', 'plugin', MCP_PLUGIN_ID ]
			);
			const base = store.getEntityRecord( 'root', '__unstableBase' ) as
				{ url?: string } | undefined;

			let status: PluginStatus = 'checking';
			if ( hasFinished ) {
				if ( ! plugin ) {
					status = 'not-installed';
				} else {
					status = plugin.status === 'active' ? 'active' : 'inactive';
				}
			}

			return {
				pluginStatus: status,
				canInstallPlugins: !! store.canUser( 'create', {
					kind: 'root',
					name: 'plugin',
				} ),
				siteUrl: base?.url,
			};
		},
		[]
	);

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const isOn = pluginStatus === 'active';

	const toggle = async ( checked: boolean ) => {
		let next: Busy = 'deactivating';
		let record: Record< string, string > = {
			plugin: MCP_PLUGIN_ID,
			status: 'inactive',
		};

		if ( checked && pluginStatus === 'not-installed' ) {
			next = 'installing';
			record = { slug: MCP_PLUGIN_SLUG, status: 'active' };
		} else if ( checked ) {
			next = 'activating';
			record = { plugin: MCP_PLUGIN_ID, status: 'active' };
		}

		setBusy( next );
		try {
			await saveEntityRecord( 'root', 'plugin', record, {
				throwOnError: true,
			} );
			createSuccessNotice(
				checked
					? __( 'AI agents can now connect to this site.' )
					: __( 'AI agents can no longer connect to this site.' ),
				{ id: 'mcp-access-toggle', type: 'snackbar' }
			);
		} catch {
			createErrorNotice(
				checked
					? __( 'Could not turn on AI agent access.' )
					: __( 'Could not turn off AI agent access.' ),
				{ id: 'mcp-access-toggle-error', type: 'snackbar' }
			);
		} finally {
			setBusy( false );
		}
	};

	const getHelp = () => {
		if ( busy === 'installing' ) {
			return __( 'Installing the <a>MCP Adapter plugin</a>…' );
		}
		if ( busy === 'activating' ) {
			return __( 'Activating the <a>MCP Adapter plugin</a>…' );
		}
		if ( busy === 'deactivating' ) {
			return __( 'Deactivating the <a>MCP Adapter plugin</a>…' );
		}
		if ( pluginStatus === 'not-installed' && ! canInstallPlugins ) {
			return __(
				'Needs the <a>MCP Adapter plugin</a>. Ask a site administrator to install it.'
			);
		}
		if ( pluginStatus === 'not-installed' ) {
			return __(
				'Turning this on installs and activates the <a>MCP Adapter plugin</a>.'
			);
		}
		if ( pluginStatus === 'inactive' ) {
			return __(
				'Turning this on activates the <a>MCP Adapter plugin</a>.'
			);
		}
		if ( isOn ) {
			return __(
				'The <a>MCP Adapter plugin</a> is active. Turning this off deactivates it.'
			);
		}
		return '';
	};

	const endpoint = siteUrl
		? `${ siteUrl }/wp-json/${ MCP_DEFAULT_ROUTE }`
		: '';
	const helpText = getHelp();
	const help = helpText
		? createInterpolateElement( helpText, {
				a: <Link href={ MCP_PLUGIN_URL } openInNewTab />,
			} )
		: '';
	const isLocked =
		!! busy ||
		pluginStatus === 'checking' ||
		( pluginStatus === 'not-installed' && ! canInstallPlugins );

	const fields = useMemo< Field< McpAccessData >[] >(
		() => [
			{
				id: 'allowAgents',
				label: __( 'Allow AI agents to connect' ),
				description: help,
				type: 'boolean',
				Edit: 'toggle',
				isDisabled: isLocked,
			},
			{
				id: 'endpoint',
				label: __( 'Endpoint' ),
				type: 'text',
				readOnly: true,
				isVisible: ( item ) => item.allowAgents && ! busy,
				render: ( { item } ) => <code>{ item.endpoint }</code>,
			},
			{
				id: 'signIn',
				label: __( 'Signing in' ),
				type: 'text',
				readOnly: true,
				getValue: () => '',
				isVisible: ( item ) => item.allowAgents && ! busy,
				render: () =>
					createInterpolateElement(
						__(
							'Each app signs in with an <a>Application Password</a>. Create a separate one per app so you can revoke it later.'
						),
						{
							a: (
								// eslint-disable-next-line jsx-a11y/anchor-has-content
								<a href="profile.php#application-passwords-section" />
							),
						}
					),
			},
		],
		[ help, isLocked, busy ]
	);

	const form: Form = {
		layout: { type: 'regular' },
		fields: [
			{
				id: 'mcp-access',
				label: __( 'AI agent access' ),
				description: __(
					'Let AI agents and apps connect to this site using the Model Context Protocol (MCP). They can only use the abilities your plugins make available, with the permissions of the user they sign in as.'
				),
				layout: {
					type: 'card',
					withHeader: true,
					isCollapsible: false,
				},
				children: [ 'allowAgents', 'endpoint', 'signIn' ],
			},
		],
	};

	return (
		<div className="mcp-access-panel">
			<DataForm< McpAccessData >
				data={ { allowAgents: isOn, endpoint } }
				fields={ fields }
				form={ form }
				onChange={ ( edits ) => {
					if (
						typeof edits.allowAgents === 'boolean' &&
						edits.allowAgents !== isOn
					) {
						toggle( edits.allowAgents );
					}
				} }
			/>
		</div>
	);
}
