/**
 * WordPress dependencies
 */
import { store, privateApis } from '@wordpress/interactivity';

const { directive, h } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

// Fake `data-wp-show-mock` directive to test when things are removed from the
// DOM.  Replace with `data-wp-show` when it's ready.
directive(
	'show-mock',
	( { directives: { 'show-mock': showMock }, element, evaluate } ) => {
		const entry = showMock.find( ( { suffix } ) => suffix === null );

		if ( ! evaluate( entry ) ) {
			element.props.children = h(
				'template',
				null,
				element.props.children
			);
		}
	}
);

store( 'tovdom-islands', {
	state: {
		falseValue: false,
	},
} );
