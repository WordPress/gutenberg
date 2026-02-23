/**
 * Example extension script for the Connectors page.
 * Demonstrates how plugins can register a connector using the @wordpress/connectors API.
 *
 * This script registers a "Hello World" connector to show how plugins can
 * add their own connectors to the Connectors settings page.
 *
 * Note: @wordpress/connectors is imported as a script module, while
 * wp.element and wp.components are accessed as globals (no build step needed).
 */

/* global wp */
import { registerConnector, ConnectorItem } from '@wordpress/connectors';

const { useState, createElement } = wp.element;
const { Button } = wp.components;

// Hello World connector render component
function HelloWorldConnector( { label, description } ) {
	const [ isExpanded, setIsExpanded ] = useState( false );

	return createElement(
		ConnectorItem,
		{
			name: label,
			description,
			actionArea: createElement(
				Button,
				{
					variant: 'secondary',
					size: 'compact',
					onClick: () => setIsExpanded( ! isExpanded ),
					'aria-expanded': isExpanded,
				},
				isExpanded ? 'Close' : 'Configure'
			),
		},
		isExpanded &&
			createElement( 'p', null, 'Hello World settings would go here!' )
	);
}

// Register the Hello World connector
registerConnector( 'example/hello-world', {
	label: 'Hello World',
	description: 'A simple example connector registered via script module.',
	render: HelloWorldConnector,
} );

// eslint-disable-next-line no-console
console.log( 'Hello World connector registered!' );
