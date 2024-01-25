/**
 * WordPress dependencies
 */
import { store, directive, createElement as h } from '@wordpress/interactivity';

// Fake `data-wp-show-mock` directive to test when things are removed from the
// DOM.  Replace with `data-wp-show` when it's ready.
directive(
	'show-mock',
	( { directives: { 'show-mock': showMock }, element, evaluate } ) => {
		const entry = showMock.find( ( { suffix } ) => suffix === 'default' );

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
