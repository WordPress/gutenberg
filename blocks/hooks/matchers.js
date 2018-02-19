/**
 * External dependencies
 */
import { isFunction, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

function warnAboutDeprecatedMatcher() {
	// eslint-disable-next-line no-console
	console.warn(
		'Attributes matchers are deprecated and they will be removed in a future version of Gutenberg. ' +
		'Please update your attributes definition https://wordpress.org/gutenberg/handbook/block-api/attributes/'
	);
}

export const attr = ( selector, attribute ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'attribute',
		attribute: attribute === undefined ? selector : attribute,
		selector: attribute === undefined ? undefined : selector,
	};
};

export const prop = ( selector, property ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'property',
		property: property === undefined ? selector : property,
		selector: property === undefined ? undefined : selector,
	};
};

export const html = ( selector ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'html',
		selector,
	};
};

export const text = ( selector ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'text',
		selector,
	};
};

export const query = ( selector, subMatchers ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'query',
		selector,
		query: subMatchers,
	};
};

export const children = ( selector ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'children',
		selector,
	};
};

export const node = ( selector ) => () => {
	warnAboutDeprecatedMatcher();
	return {
		source: 'node',
		selector,
	};
};

/**
 * Resolve the matchers attributes for backwards compatibilty.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function resolveAttributes( settings ) {
	// Resolve deprecated attributes
	settings.attributes = mapValues( settings.attributes, ( attribute ) => {
		if ( isFunction( attribute.source ) ) {
			return {
				...attribute,
				...attribute.source(),
			};
		}
		return attribute;
	} );

	return settings;
}

addFilter( 'blocks.registerBlockType', 'core/matchers', resolveAttributes );
