/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

export const Circle = ( props ) => createElement( 'circle', props );
export const G = ( props ) => createElement( 'g', props );
export const Path = ( props ) => createElement( 'path', props );
export const Polygon = ( props ) => createElement( 'polygon', props );
export const Rect = ( props ) => createElement( 'rect', props );

export const SVG = ( { className, isPressed, ...props } ) => {
	const appliedProps = {
		...props,
		className: classnames( className, { 'is-pressed': isPressed } ) || undefined,
		role: 'img',
		'aria-hidden': 'true',
		focusable: 'false',
	};

	// Disable reason: We need to have a way to render HTML tag for web.
	// eslint-disable-next-line react/forbid-elements
	return <svg { ...appliedProps } />;
};
