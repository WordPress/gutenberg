/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { WpLogoDecoration } from './wp-logo-decoration';

import type { PluginStatus } from './use-connector-plugin';

const AI_PLUGIN_SLUG = 'ai';
const AI_PLUGIN_ID = 'ai/plugin';
const AI_PLUGIN_URL = 'https://wordpress.org/plugins/ai/';

export function AiPluginCallout() {
	const [ isBusy, setIsBusy ] = useState( false );
	const [ completedAction, setCompletedAction ] = useState<
		'installed' | 'activated' | null
	>( null );

	const { pluginStatus, canInstallPlugins, canManagePlugins } = useSelect(
		( select ) => {
			const store = select( coreStore );

			const canCreate = !! store.canUser( 'create', {
				kind: 'root',
				name: 'plugin',
			} );

			const plugins = store.getEntityRecords( 'root', 'plugin' ) as
				| Array< { plugin: string; status: string } >
				| null;

			if ( plugins === null ) {
				const hasFinished = store.hasFinishedResolution(
					'getEntityRecords',
					[ 'root', 'plugin' ]
				);

				if ( ! hasFinished ) {
					return {
						pluginStatus: 'checking' as PluginStatus,
						canInstallPlugins: canCreate,
						canManagePlugins: undefined as boolean | undefined,
					};
				}

				return {
					pluginStatus: 'not-installed' as PluginStatus,
					canInstallPlugins: canCreate,
					canManagePlugins: false,
				};
			}

			const plugin = plugins.find( ( p ) => p.plugin === AI_PLUGIN_ID );
			let status: PluginStatus = 'not-installed';
			if ( plugin ) {
				status = plugin.status === 'active' ? 'active' : 'inactive';
			}

			return {
				pluginStatus: status,
				canInstallPlugins: canCreate,
				canManagePlugins: true,
			};
		},
		[]
	);

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
			setCompletedAction( 'installed' );
		} catch {
			// Handle error
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
			setCompletedAction( 'activated' );
		} catch {
			// Handle error
		} finally {
			setIsBusy( false );
		}
	};

	// Hide while checking to avoid flash.
	if ( pluginStatus === 'checking' ) {
		return null;
	}

	// Already active and no completed action to show.
	if ( pluginStatus === 'active' && ! completedAction ) {
		return null;
	}

	// No permissions to install.
	if ( canInstallPlugins === false ) {
		return null;
	}

	// Can't activate (no manage permissions).
	if ( pluginStatus === 'inactive' && canManagePlugins === false ) {
		return null;
	}

	const getPrimaryButtonProps = () => {
		if ( completedAction === 'installed' ) {
			return {
				label: __( 'Installed' ),
				disabled: true,
				onClick: undefined,
			};
		}
		if ( completedAction === 'activated' ) {
			return {
				label: __( 'Activated' ),
				disabled: true,
				onClick: undefined,
			};
		}
		if ( pluginStatus === 'not-installed' ) {
			return {
				label: isBusy
					? __( 'Installing…' )
					: __( 'Install AI Experiments' ),
				disabled: isBusy,
				onClick: isBusy ? undefined : installPlugin,
			};
		}
		// inactive
		return {
			label: isBusy
				? __( 'Activating…' )
				: __( 'Activate AI Experiments' ),
			disabled: isBusy,
			onClick: isBusy ? undefined : activatePlugin,
		};
	};

	const primaryButton = getPrimaryButtonProps();

	return (
		<div className="ai-plugin-callout">
			<div className="ai-plugin-callout__content">
				<p>
					{ createInterpolateElement(
						__(
							'The <strong>AI plugin</strong> can use your connectors to generate featured images, alt text, titles, excerpts and more.'
						),
						{
							strong: <strong />,
						}
					) }
				</p>
				<div className="ai-plugin-callout__actions">
					<Button
						variant="primary"
						size="compact"
						isBusy={ isBusy }
						disabled={ primaryButton.disabled }
						onClick={ primaryButton.onClick }
					>
						{ primaryButton.label }
					</Button>
					<Button
						variant="tertiary"
						href={ AI_PLUGIN_URL }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Learn more' ) }
					</Button>
				</div>
			</div>
			<WpLogoDecoration />
		</div>
	);
}
