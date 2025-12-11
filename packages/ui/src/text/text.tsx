import { forwardRef } from '@wordpress/element';
import { type TextProps } from './types';
import { renderElement } from '../utils/element';

/**
 * Default render function that renders a span element with the given props.
 *
 * @param props The props to apply to the HTML element.
 */
const DEFAULT_RENDER = ( props: React.ComponentPropsWithoutRef< 'span' > ) => (
	<span { ...props } />
);

/**
 * A typography primitive that provides an interface for applying design
 * token-based typography styles including font family, size, weight, and line height.
 */
export const Text = forwardRef< HTMLSpanElement, TextProps >( function Text(
	{
		fontFamily,
		fontSize,
		fontWeight,
		lineHeight,
		render = DEFAULT_RENDER,
		...props
	},
	ref
) {
	const style: React.CSSProperties = { ...props.style };

	if ( fontFamily ) {
		style.fontFamily = `var(--wpds-font-family-${ fontFamily })`;
	}

	if ( fontSize ) {
		style.fontSize = `var(--wpds-font-size-${ fontSize })`;
	}

	if ( fontWeight ) {
		style.fontWeight = `var(--wpds-font-weight-${ fontWeight })`;
	}

	if ( lineHeight ) {
		style.lineHeight = `var(--wpds-font-line-height-${ lineHeight })`;
	}

	return renderElement< 'span' >( {
		render,
		defaultTagName: 'span',
		ref,
		props: { ...props, style },
	} );
} );
