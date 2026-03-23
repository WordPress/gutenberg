/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import {
	Button,
	__experimentalHeading as Heading,
	__experimentalText as Text,
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

/**
 * Internal dependencies
 */
import './style.scss';
import { AiPluginCallout } from './ai-plugin-callout';
import { registerDefaultConnectors } from './default-connectors';
import { unlock } from '../lock-unlock';

const { store } = unlock( connectorsPrivateApis );

// Register built-in connectors
registerDefaultConnectors();

function ConnectorsPage() {
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

	const isEmpty = connectors.length === 0;

	return (
		<Page
			title={ __( 'Connectors' ) }
			headingLevel={ 1 }
			subTitle={ __(
				'All of your API keys and credentials are stored here and shared across plugins. Configure once and use everywhere.'
			) }
		>
			<div
				className={ `connectors-page${
					isEmpty ? ' connectors-page--empty' : ''
				}` }
			>
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
							<Text size={ 12 }>
								{ __(
									'Connectors appear here when you install plugins that use external services. Each plugin registers the API keys it needs, and you manage them all in one place.'
								) }
							</Text>
						</VStack>
						<Button variant="secondary" href="plugin-install.php">
							{ __( 'Learn more' ) }
						</Button>
					</VStack>
				) : (
					<VStack spacing={ 3 }>
						<AiPluginCallout />
						{ connectors.map( ( connector: ConnectorConfig ) => {
							if ( connector.render ) {
								return (
									<connector.render
										key={ connector.slug }
										slug={ connector.slug }
										name={ connector.name }
										description={ connector.description }
										logo={ connector.logo }
										authentication={
											connector.authentication
										}
										plugin={ connector.plugin }
									/>
								);
							}
							return null;
						} ) }
					</VStack>
				) }
				{ canInstallPlugins && (
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
