/**
 * External dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

// deprecations
export const G = ( props ) => {
	deprecated( 'wp.components.G', {
		version: '4.2',
		alternative: 'g',
		plugin: 'Gutenberg',
	} );
	return createElement( 'g', props );
}

export const Path = ( props ) => {
	deprecated( 'wp.components.Path', {
		version: '4.2',
		alternative: 'path',
		plugin: 'Gutenberg',
	} );
	return createElement( 'path', props );
}

export const Polygon = ( props ) => {
	deprecated( 'wp.components.Polygon', {
		version: '4.2',
		alternative: 'polygon',
		plugin: 'Gutenberg',
	} );
	return createElement( 'polygon', props );
}

export const SVG = ( props ) => {
	deprecated( 'wp.components.SVG', {
		version: '4.2',
		alternative: 'svg',
		plugin: 'Gutenberg',
	} );

	const appliedProps = {
		...props,
		role: 'img',
		'aria-hidden': 'true',
		focusable: 'false',
	};

	return <svg { ...appliedProps } />;
};

export const AccessibleSVG = ( props ) => {
	deprecated( 'wp.components.AccessibleSVG', {
		version: '4.2',
		alternative: 'svg',
		plugin: 'Gutenberg',
	} );
	return <svg { ...props } />;
};
