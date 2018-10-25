/**
 * External dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export const Circle = ( props ) => createElement( 'circle', props );
export const G = ( props ) => createElement( 'g', props );
export const Path = ( props ) => createElement( 'path', props );
export const Polygon = ( props ) => createElement( 'polygon', props );
export const Rect = ( props ) => createElement( 'rect', props );

export const SVG = ( props ) => {
	const appliedProps = {
		...props,
		role: 'img',
		'aria-hidden': 'true',
		focusable: 'false',
	};

	// Disable reason: We need to have a way to render HTML tag for web.
	// eslint-disable-next-line react/forbid-elements
	return <svg { ...appliedProps } />;
};

// deprecations
export const AccessibleSVG = ( props ) => {
	deprecated( 'wp.components.AccessibleSVG', {
		version: '4.2',
		alternative: 'wp.components.SVG',
		plugin: 'Gutenberg',
	} );
	return <SVG { ...props } />;
};
