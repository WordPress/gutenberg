/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import {
	Button,
	__experimentalHeading as Heading,
	__experimentalText as WCText,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	privateApis as connectorsPrivateApis,
	type ConnectorConfig,
} from '@wordpress/connectors';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Notice } from '@wordpress/ui';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * Internal dependencies
 */
import './style.scss';
import { AiPluginCallout } from './ai-plugin-callout';
import {
	getIsFileModDisabled,
	registerDefaultConnectors,
} from './default-connectors';

const { store } = unlock( connectorsPrivateApis );

// Register built-in connectors
registerDefaultConnectors();

function ConnectorsPage() {
	const isFileModDisabled = getIsFileModDisabled();

	const { connectors, canInstallPlugins, isAiPluginInstalled } = useSelect(
		( select ) => {
			const coreSelect = select( coreStore );
			const aiPlugin = coreSelect.getEntityRecord(
				'root',
				'plugin',
				'ai/ai'
			);
			return {
				connectors: unlock( select( store ) ).getConnectors(),
				canInstallPlugins: coreSelect.canUser( 'create', {
					kind: 'root',
					name: 'plugin',
				} ),
				isAiPluginInstalled: !! aiPlugin,
			};
		},
		[]
	);

	const renderableConnectors = connectors.filter(
		( connector: ConnectorConfig ) => connector.render
	);
	const aiProviderPluginSlugs = Array.from(
		new Set(
			connectors
				.filter(
					( connector: ConnectorConfig ) =>
						connector.type === 'ai_provider'
				)
				.map(
					( connector: ConnectorConfig ) =>
						connector.plugin?.file?.split( '/' )[ 0 ]
				)
				.filter( ( slug ): slug is string => !! slug )
		)
	).sort();
	const installedPluginSlugs = new Set(
		connectors
			.filter(
				( connector: ConnectorConfig ) => connector.plugin?.isInstalled
			)
			.map(
				( connector: ConnectorConfig ) =>
					connector.plugin?.file?.split( '/' )[ 0 ]
			)
			.filter( ( slug: string | undefined ): slug is string => !! slug )
	);
	if ( isAiPluginInstalled ) {
		installedPluginSlugs.add( 'ai' );
	}
	const manualInstallPluginSlugs = [ 'ai', ...aiProviderPluginSlugs ].filter(
		( slug ) => ! installedPluginSlugs.has( slug )
	);
	const isEmpty = renderableConnectors.length === 0;

	return (
		<Page
			title={ __( 'Connectors' ) }
			subTitle={ __(
				'All of your API keys and credentials are stored here and shared across plugins. Configure once and use everywhere.'
			) }
		>
			<div
				className={ `connectors-page${
					isEmpty ? ' connectors-page--empty' : ''
				}` }
			>
				{ manualInstallPluginSlugs.length > 0 &&
					( isFileModDisabled || ! canInstallPlugins ) && (
						<Notice.Root
							intent="info"
							className="connectors-page__file-mods-notice"
						>
							<Notice.Description>
								{ isFileModDisabled
									? __(
											'Plugins cannot be installed here due to your site configuration. Install them manually using your normal deployment workflow.'
									  )
									: __(
											'You do not have permission to install plugins. Please ask a site administrator to install them for you.'
									  ) }
							</Notice.Description>
						</Notice.Root>
					) }
				{ isEmpty ? (
					<VStack
						alignment="center"
						spacing={ 3 }
						style={ { maxWidth: 480 } }
					>
						<VStack alignment="center" spacing={ 2 }>
							<Heading level={ 2 } size={ 15 } weight={ 600 }>
								{ __( 'No connectors yet' ) }
							</Heading>
							<WCText size={ 12 }>
								{ __(
									'Connectors appear here when you install plugins that use external services. Each plugin registers the API keys it needs, and you manage them all in one place.'
								) }
							</WCText>
						</VStack>
						<Button
							variant="secondary"
							href="plugin-install.php"
							__next40pxDefaultSize
						>
							{ __( 'Learn more' ) }
						</Button>
					</VStack>
				) : (
					<VStack spacing={ 3 }>
						<AiPluginCallout />
						<VStack spacing={ 3 } role="list">
							{ connectors.map(
								( connector: ConnectorConfig ) => {
									if ( connector.render ) {
										return (
											<connector.render
												key={ connector.slug }
												slug={ connector.slug }
												name={ connector.name }
												description={
													connector.description
												}
												type={ connector.type }
												logo={ connector.logo }
												authentication={
													connector.authentication
												}
												plugin={ connector.plugin }
											/>
										);
									}
									return null;
								}
							) }
						</VStack>
					</VStack>
				) }
				{ canInstallPlugins && ! isFileModDisabled && (
					<p>
						{ createInterpolateElement(
							__(
								'If the connector you need is not listed, <a>search the plugin directory</a> to see if a connector is available.'
							),
							{
								a: (
									// eslint-disable-next-line jsx-a11y/anchor-has-content
									<a href="plugin-install.php?s=connector&tab=search&type=tag" />
								),
							}
						) }
					</p>
				) }
			</div>
		</Page>
	);
}

function Stage() {
	return <ConnectorsPage />;
}

export const stage = Stage;
