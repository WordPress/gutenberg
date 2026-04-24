/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import {
	Button,
	Notice,
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
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import './style.scss';
import { AiPluginCallout } from './ai-plugin-callout';
import {
	getIsFileModsDisabled,
	registerDefaultConnectors,
} from './default-connectors';
import { unlock } from '../lock-unlock';

const { store } = unlock( connectorsPrivateApis );

// Register built-in connectors
registerDefaultConnectors();

function ConnectorsPage() {
	const isFileModsDisabled = getIsFileModsDisabled();

	const { connectors, canInstallPlugins } = useSelect(
		( select ) => ( {
			connectors: unlock( select( store ) ).getConnectors(),
			canInstallPlugins: select( coreStore ).canUser( 'create', {
				kind: 'root',
				name: 'plugin',
			} ),
		} ),
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
	const manualInstallPluginSlugs = [ 'ai', ...aiProviderPluginSlugs ];
	const isEmpty = renderableConnectors.length === 0;
	const searchUrl =
		canInstallPlugins && ! isFileModsDisabled
			? 'plugin-install.php?s=connector&tab=search&type=tag'
			: __( 'https://wordpress.org/plugins/search/ai-connectors/' );

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
				{ isFileModsDisabled && (
					<Notice
						status="notice"
						isDismissible={ false }
						className="connectors-page__file-mods-notice"
					>
						<p>
							{ __(
								'Plugin installation from wp-admin is disabled because DISALLOW_FILE_MODS is enabled. Install the AI plugin and any AI provider plugins manually using your normal deployment workflow.'
							) }
						</p>
						<p>{ __( 'WP-CLI examples:' ) }</p>
						<ul>
							{ manualInstallPluginSlugs.map( ( slug ) => {
								const command = `wp plugin install ${ slug } --activate`;
								return (
									<li key={ slug }>
										{ sprintf(
											/* translators: %s: Plugin slug. */
											__( '%s:' ),
											slug
										) }{ ' ' }
										<code>{ command }</code>
									</li>
								);
							} ) }
						</ul>
					</Notice>
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
						<Button variant="secondary" href="plugin-install.php">
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
					<p>
						{ createInterpolateElement(
							__(
								'If the connector you need is not listed, <a>search the plugin directory</a> to see if a connector is available.'
							),
							{
								a: (
									// eslint-disable-next-line jsx-a11y/anchor-has-content
								<a href={ searchUrl } />
								),
							}
						) }
					</p>
			</div>
		</Page>
	);
}

function Stage() {
	return <ConnectorsPage />;
}

export const stage = Stage;
