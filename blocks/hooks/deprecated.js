/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, RawHTML } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Wrapper component for RawHTML, logging a warning about unsupported raw
 * markup return values from a block's `save` implementation.
 */
export class RawHTMLWithWarning extends Component {
	constructor() {
		super( ...arguments );

		// Disable reason: We're intentionally logging a console warning
		// advising the developer to upgrade usage.

		// eslint-disable-next-line no-console
		console.warn(
			'Deprecated: Returning raw HTML from block `save` is not supported. ' +
			'Use `wp.element.RawHTML` component instead.\n\n' +
			'See: https://wordpress.org/gutenberg/handbook/block-api/block-edit-save/#save'
		);
	}

	render() {
		const { children } = this.props;

		return <RawHTML>{ children }</RawHTML>;
	}
}

/**
 * Override save element for a block, providing support for deprecated HTML
 * return value, logging a warning advising the developer to use the preferred
 * RawHTML component instead.
 *
 * @param {WPElement} element Original block save return.
 *
 * @return {WPElement} Dangerously shimmed block save.
 */
export function shimRawHTML( element ) {
	// Still support string return from save, but in the same way any component
	// could render a string, it should be escaped. Therefore, only shim usage
	// which had included some HTML expected to be unescaped.
	if ( typeof element === 'string' && ( includes( element, '<' ) || /^\[.+\]$/.test( element ) ) ) {
		element = <RawHTMLWithWarning children={ element } />;
	}

	return element;
}

addFilter(
	'blocks.getSaveElement',
	'core/deprecated/shim-dangerous-html',
	shimRawHTML
);
