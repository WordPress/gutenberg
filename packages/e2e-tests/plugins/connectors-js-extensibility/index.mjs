/**
 * Script module that demonstrates client-side connector registration
 * using the merging (upsert) strategy.
 *
 * Two registerConnector() calls target the same slug. The store
 * shallow-merges each call, so the final connector combines the
 * render function from one call with label/description from the other.
 */

import {
	__experimentalRegisterConnector as registerConnector,
	__experimentalConnectorItem as ConnectorItem,
} from '@wordpress/connectors';

const h = window.React.createElement;

// Register the render function for the connector.
registerConnector( 'test_custom_service', {
	render: ( props ) =>
		h(
			ConnectorItem,
			{
				className: 'connector-item--test_custom_service',
				name: props.label,
				description: props.description,
				icon: props.icon,
			},
			h(
				'p',
				{ className: 'test-custom-service-content' },
				'Custom rendered content for testing.'
			)
		),
} );
