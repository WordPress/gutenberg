/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { Button, ExternalLink } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	createInterpolateElement,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getConnectorData } from './default-connectors';
import { WpLogoDecoration } from './wp-logo-decoration';

import type { PluginStatus } from './use-connector-plugin';

const AI_PLUGIN_SLUG = 'ai';
const AI_PLUGIN_ID = 'ai/ai';
const AI_PLUGIN_URL = 'https://wordpress.org/plugins/ai/';

const connectorDataValues = Object.values( getConnectorData() );
const hasAiProviders = connectorDataValues.some(
	( c ) => c.type === 'ai_provider'
);
const aiProviderSettingNames: string[] = [];
for ( const c of connectorDataValues ) {
	if ( c.type === 'ai_provider' && c.authentication.method === 'api_key' ) {
		aiProviderSettingNames.push( c.authentication.settingName );
	}
}

export function AiPluginCallout() {
	const [ isBusy, setIsBusy ] = useState( false );
	const [ justActivated, setJustActivated ] = useState( false );
	const actionButtonRef = useRef< HTMLButtonElement >( null );

	// Restore focus to the button after install/activate completes.
	useEffect( () => {
		if ( justActivated ) {
			actionButtonRef.current?.focus();
		}
	}, [ justActivated ] );

	// Server-side initial state — true if any provider was already connected at page load.
	const initialHasConnectedProvider = useRef(
		connectorDataValues.some(
			( c ) =>
				c.type === 'ai_provider' &&
				c.authentication.method === 'api_key' &&
				c.authentication.isConnected
		)
	).current;

	const {
		pluginStatus,
		canInstallPlugins,
		canManagePlugins,
		hasConnectedProvider,
	} = useSelect( ( select ) => {
		const store = select( coreStore );

		const canCreate = !! store.canUser( 'create', {
			kind: 'root',
			name: 'plugin',
		} );

		// Reactive check: any AI provider setting has a non-empty value.
		const siteSettings = store.getEntityRecord( 'root', 'site' ) as
			| Record< string, string >
			| undefined;
		const hasConnected =
			initialHasConnectedProvider ||
			aiProviderSettingNames.some(
				( name ) => !! siteSettings?.[ name ]
			);

		const plugin = store.getEntityRecord(
			'root',
			'plugin',
			AI_PLUGIN_ID
		) as { plugin: string; status: string } | undefined;

		const hasFinished = store.hasFinishedResolution( 'getEntityRecord', [
			'root',
			'plugin',
			AI_PLUGIN_ID,
		] );

		if ( ! hasFinished ) {
			return {
				pluginStatus: 'checking' as PluginStatus,
				canInstallPlugins: canCreate,
				canManagePlugins: undefined as boolean | undefined,
				hasConnectedProvider: hasConnected,
			};
		}

		if ( ! plugin ) {
			return {
				pluginStatus: 'not-installed' as PluginStatus,
				canInstallPlugins: canCreate,
				canManagePlugins: canCreate,
				hasConnectedProvider: hasConnected,
			};
		}

		return {
			pluginStatus: ( plugin.status === 'active'
				? 'active'
				: 'inactive' ) as PluginStatus,
			canInstallPlugins: canCreate,
			canManagePlugins: true,
			hasConnectedProvider: hasConnected,
		};
	}, [] );

	const { saveEntityRecord } = useDispatch( coreStore );

	const installPlugin = async () => {
		setIsBusy( true );
		try {
			await saveEntityRecord(
				'root',
				'plugin',
				{ slug: AI_PLUGIN_SLUG, status: 'active' },
				{ throwOnError: true }
			);
			setJustActivated( true );
			speak( __( 'AI plugin installed and activated successfully.' ) );
		} catch {
			speak( __( 'Failed to install the AI plugin.' ), 'assertive' );
		} finally {
			setIsBusy( false );
		}
	};

	const activatePlugin = async () => {
		setIsBusy( true );
		try {
			await saveEntityRecord(
				'root',
				'plugin',
				{ plugin: AI_PLUGIN_ID, status: 'active' },
				{ throwOnError: true }
			);
			setJustActivated( true );
			speak( __( 'AI plugin activated successfully.' ) );
		} catch {
			speak( __( 'Failed to activate the AI plugin.' ), 'assertive' );
		} finally {
			setIsBusy( false );
		}
	};

	// Only show when at least one AI provider connector is registered.
	if ( ! hasAiProviders ) {
		return null;
	}

	// Hide while checking to avoid flash.
	if ( pluginStatus === 'checking' ) {
		return null;
	}

	// Already connected at page load — nothing to show.
	if (
		pluginStatus === 'active' &&
		initialHasConnectedProvider &&
		! justActivated
	) {
		return null;
	}

	// Not installed and no permissions to install.
	if ( pluginStatus === 'not-installed' && canInstallPlugins === false ) {
		return null;
	}

	// Installed but can't activate (no manage permissions).
	if ( pluginStatus === 'inactive' && canManagePlugins === false ) {
		return null;
	}

	const isActiveNoProvider =
		pluginStatus === 'active' && ! hasConnectedProvider;
	const isJustConnected =
		pluginStatus === 'active' &&
		hasConnectedProvider &&
		( ! initialHasConnectedProvider || justActivated );
	const showInstallActivate =
		pluginStatus === 'not-installed' || pluginStatus === 'inactive';

	const getMessage = () => {
		if ( isJustConnected ) {
			return __(
				'The <strong>AI plugin</strong> is ready to use. You can use it to generate featured images, alt text, titles, excerpts and more. <a>Learn more</a>'
			);
		}
		if ( isActiveNoProvider ) {
			return __(
				'The <strong>AI plugin</strong> is installed. Connect a provider below to generate featured images, alt text, titles, excerpts, and more. <a>Learn more</a>'
			);
		}
		return __(
			'The <strong>AI plugin</strong> can use your connectors to generate featured images, alt text, titles, excerpts and more. <a>Learn more</a>'
		);
	};

	const getPrimaryButtonProps = () => {
		if ( pluginStatus === 'not-installed' ) {
			return {
				label: isBusy
					? __( 'Installing…' )
					: __( 'Install the AI plugin' ),
				disabled: isBusy,
				onClick: isBusy ? undefined : installPlugin,
			};
		}
		// inactive
		return {
			label: isBusy
				? __( 'Activating…' )
				: __( 'Activate the AI plugin' ),
			disabled: isBusy,
			onClick: isBusy ? undefined : activatePlugin,
		};
	};

	return (
		<div className="ai-plugin-callout">
			<div className="ai-plugin-callout__content">
				<p>
					{ createInterpolateElement( getMessage(), {
						strong: <strong />,
						// @ts-ignore children are injected by createInterpolateElement at runtime.
						a: <ExternalLink href={ AI_PLUGIN_URL } />,
					} ) }
				</p>
				{ showInstallActivate ? (
					<Button
						variant="primary"
						size="compact"
						isBusy={ isBusy }
						disabled={ getPrimaryButtonProps().disabled }
						accessibleWhenDisabled
						onClick={ getPrimaryButtonProps().onClick }
					>
						{ getPrimaryButtonProps().label }
					</Button>
				) : (
					<Button
						ref={ actionButtonRef }
						variant="secondary"
						size="compact"
						href={ addQueryArgs( 'options-general.php', {
							page: AI_PLUGIN_SLUG,
						} ) }
					>
						{ __( 'Control features in the AI plugin' ) }
					</Button>
				) }
			</div>
			<WpLogoDecoration />
		</div>
	);
}
