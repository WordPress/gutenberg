/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RichText } from '../src';

render(
	<RichText onChange={ ( newValue ) => window._value = newValue } />,
	document.querySelector( 'div' )
);
