/**
 * Script module that demonstrates client-side connector registration.
 *
 * The server registers test_custom_service with its name and description.
 * This module calls registerConnector() with the same slug to add a render
 * function. The store merges both registrations, so the final connector
 * combines the render function from JS with the metadata from PHP.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
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
				name: props.name,
				description: props.description,
				logo: props.logo,
			},
			h(
				'p',
				{ className: 'test-custom-service-content' },
				'Custom rendered content for testing.'
			)
		),
} );
