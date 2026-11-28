import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import {
	createInterpolateElement,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Link } from '@wordpress/ui';
import {
	getIsFileModDisabled,
	getMcpAdapterData,
	type McpAdapterData,
} from './default-connectors';

const MCP_PLUGIN_SLUG = 'mcp-adapter';
const MCP_PLUGIN_ID = 'mcp-adapter/mcp-adapter';
const MCP_PLUGIN_URL = 'https://wordpress.org/plugins/mcp-adapter/';

type Busy = false | 'installing' | 'activating' | 'deactivating';

type McpStatus = McpAdapterData[ 'status' ];

type McpAccessData = {
	allowAgents: boolean;
	endpoint: string;
};

function EndpointValue( { item }: { item: McpAccessData } ) {
	return <code>{ item.endpoint }</code>;
}

function SignInNote() {
	return createInterpolateElement(
		__(
			'Each app signs in with an <a>Application Password</a>. Create a separate one per app so you can revoke it later.'
		),
		{
			a: <Link href="profile.php#application-passwords-section" />,
		}
	);
}

export function McpAccessPanel() {
	const [ busy, setBusy ] = useState< Busy >( false );
	const panelRef = useRef< HTMLDivElement >( null );
	const restoreFocusRef = useRef( false );

	// The toggle is disabled while a request runs, which drops keyboard focus.
	// Put it back once the request is done, unless the user moved on.
	useEffect( () => {
		const panel = panelRef.current;
		if ( busy || ! restoreFocusRef.current || ! panel ) {
			return;
		}
		restoreFocusRef.current = false;
		const { activeElement, body } = panel.ownerDocument;
		if ( ! activeElement || activeElement === body ) {
			panel
				.querySelector< HTMLInputElement >( 'input[type="checkbox"]' )
				?.focus();
		}
	}, [ busy ] );

	const serverState = useMemo( () => getMcpAdapterData(), [] );
	const isFileModDisabled = useMemo( () => getIsFileModDisabled(), [] );
	const canInstall = !! serverState?.canInstall;
	const canActivate = !! serverState?.canActivate;

	// Reading the plugin record needs `activate_plugins`, so users without it
	// rely on the state the server sent with the page.
	const recordStatus = useSelect(
		( select ) => {
			if ( ! canActivate ) {
				return undefined;
			}
			const plugin = select( coreStore ).getEntityRecord(
				'root',
				'plugin',
				MCP_PLUGIN_ID
			) as { status: McpStatus } | undefined;

			return plugin?.status;
		},
		[ canActivate ]
	);

	const status: McpStatus =
		recordStatus ?? serverState?.status ?? 'not-installed';
	const isOn = status === 'active' || status === 'network-active';

	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const toggle = async ( checked: boolean ) => {
		let next: Busy = 'deactivating';
		let record: Record< string, string > = {
			plugin: MCP_PLUGIN_ID,
			status: 'inactive',
		};

		if ( checked && status === 'not-installed' ) {
			next = 'installing';
			record = { slug: MCP_PLUGIN_SLUG, status: 'active' };
		} else if ( checked ) {
			next = 'activating';
			record = { plugin: MCP_PLUGIN_ID, status: 'active' };
		}

		restoreFocusRef.current = !! panelRef.current?.contains(
			panelRef.current.ownerDocument.activeElement
		);
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
			// A failed install can still leave the plugin on disk, and a timed
			// out request can still finish, so read the real state again.
			invalidateResolution( 'getEntityRecord', [
				'root',
				'plugin',
				MCP_PLUGIN_ID,
			] );
		} finally {
			setBusy( false );
		}
	};

	const help = useMemo( () => {
		let text: string;

		if ( busy === 'installing' ) {
			text = __( 'Installing the <a>MCP Adapter plugin</a>…' );
		} else if ( busy === 'activating' ) {
			text = __( 'Activating the <a>MCP Adapter plugin</a>…' );
		} else if ( busy === 'deactivating' ) {
			text = __( 'Deactivating the <a>MCP Adapter plugin</a>…' );
		} else if ( status === 'network-active' ) {
			text = __(
				'The <a>MCP Adapter plugin</a> is active across the network. A network administrator can turn it off.'
			);
		} else if ( ! canActivate ) {
			text = isOn
				? __(
						'The <a>MCP Adapter plugin</a> is active. Only users who can manage plugins can turn it off.'
					)
				: __(
						'Only users who can manage plugins can turn on the <a>MCP Adapter plugin</a>.'
					);
		} else if ( status === 'not-installed' && isFileModDisabled ) {
			text = __(
				'Plugins cannot be installed here due to your site configuration. Install the <a>MCP Adapter plugin</a> using your normal deployment workflow.'
			);
		} else if ( status === 'not-installed' && ! canInstall ) {
			text = __(
				'Needs the <a>MCP Adapter plugin</a>. Ask a site administrator to install it.'
			);
		} else if ( status === 'not-installed' ) {
			text = __(
				'Turning this on installs and activates the <a>MCP Adapter plugin</a>.'
			);
		} else if ( status === 'inactive' ) {
			text = __(
				'Turning this on activates the <a>MCP Adapter plugin</a>.'
			);
		} else {
			text = __(
				'The <a>MCP Adapter plugin</a> is active. Turning this off deactivates it.'
			);
		}

		return createInterpolateElement( text, {
			a: <Link href={ MCP_PLUGIN_URL } openInNewTab />,
		} );
	}, [ busy, status, isOn, canActivate, canInstall, isFileModDisabled ] );

	const isLocked =
		!! busy ||
		status === 'network-active' ||
		! canActivate ||
		( status === 'not-installed' && ( isFileModDisabled || ! canInstall ) );

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
				render: EndpointValue,
			},
			{
				id: 'signIn',
				label: __( 'Signing in' ),
				type: 'text',
				readOnly: true,
				getValue: () => '',
				isVisible: ( item ) => item.allowAgents && ! busy,
				render: SignInNote,
			},
		],
		[ help, isLocked, busy ]
	);

	const form = useMemo< Form >(
		() => ( {
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
		} ),
		[]
	);

	return (
		<div className="mcp-access-panel" ref={ panelRef }>
			<DataForm< McpAccessData >
				data={ {
					allowAgents: isOn,
					endpoint: serverState?.endpoint ?? '',
				} }
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
