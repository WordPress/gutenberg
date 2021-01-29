/**
 * Internal dependencies
 */
import { __unstableWithNext as withNext } from '../../__next/context';
import NextText from './text';
import { text } from '../styles/text-mixins';

// @ts-ignore
const Text = process.env.COMPONENT_SYSTEM_PHASE === 1 ? NextText : undefined;

/**
 * @param {Object} props
 * @param {keyof JSX.IntrinsicElements} props.as
 * @param {import('../styles/text-mixins').TextVariant} props.variant
 */
export const adapter = ( { as, variant, ...restProps } ) => ( {
	// as has not changed
	as,
	// luckily `text` just returns an emotion CSS object, so we can pass the styles from that directly to the handy `css` prop
	css: text( { variant } ).styles,
	// mostly className
	...restProps,
} );

/* eslint-disable jsdoc/valid-types */
/**
 * @param {import('react').ComponentType<{ as: keyof JSX.IntrinsicElements, variant: import('../styles/text-mixins').TextVariant }>} Current
 */
/* eslint-enable jsdoc/valid-types */
export function withNextComponent( Current ) {
	return withNext( Current, Text, 'WPComponentsText', adapter );
}
