/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __experimentalVStack as VStack } from '@wordpress/components';
import {
	privateApis as connectorsPrivateApis,
	type ConnectorConfig,
} from '@wordpress/connectors';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerDefaultConnectors } from './default-connectors';
import { unlock } from '../lock-unlock';

const { store } = unlock( connectorsPrivateApis );

// Register built-in connectors
registerDefaultConnectors();

function ConnectorsPage() {
	const connectors = useSelect(
		( select ) => unlock( select( store ) ).getConnectors(),
		[]
	);

	return (
		<Page
			title={ __( 'Connectors' ) }
			subTitle={ __(
				'All of your API keys and credentials are stored here and shared across plugins. Configure once and use everywhere.'
			) }
		>
			<div className="connectors-page">
				<VStack spacing={ 3 }>
					{ connectors.map( ( connector: ConnectorConfig ) => {
						if ( connector.render ) {
							return (
								<connector.render
									key={ connector.slug }
									slug={ connector.slug }
									label={ connector.label }
									description={ connector.description }
								/>
							);
						}
						return null;
					} ) }
				</VStack>
				<p>
					{ createInterpolateElement(
						__(
							'Find more connectors in <a>the plugin directory</a>'
						),
						{
							a: (
								// eslint-disable-next-line jsx-a11y/anchor-has-content
								<a href="plugin-install.php" />
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
