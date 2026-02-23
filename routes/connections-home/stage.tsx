/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { store, type ConnectorConfig } from '@wordpress/connectors';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerDefaultConnectors } from './default-connectors';

// Register built-in connectors
registerDefaultConnectors();

function ConnectorsPage() {
	const connectors = useSelect(
		( select ) => select( store ).getConnectors(),
		[]
	);

	return (
		<Page
			title={ __( 'Connectors' ) }
			subTitle={ __(
				'All of your API keys and credentials are stored here and shared across plugins. Configure once and use everywhere.'
			) }
		>
			<div className="connections-page">
				<VStack spacing={ 4 }>
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
			</div>
		</Page>
	);
}

function Stage() {
	return <ConnectorsPage />;
}

export const stage = Stage;
