/**
 * Internal dependencies
 */
import { withNext } from '../ui/context';
import { Text as NextText } from '../ui/text';
import { text } from './styles/text-mixins';

const Text = process.env.COMPONENT_SYSTEM_PHASE === 1 ? NextText : undefined;

/**
 * @typedef AdaptedTextProps
 * @property {keyof JSX.IntrinsicElements} as Styled components `as` prop.
 * @property {import('./styles/text-mixins').TextVariant} variant The variant to render.
 * @property {import('react').ReactNode} children Children to render.
 * @property {string} [className] Classname to render on the element.
 */

/**
 * @param {AdaptedTextProps} props
 */
export const adapter = ( { as, variant, ...restProps } ) => ( {
	// as has not changed
	as,
	// luckily `text` just returns an emotion CSS object, so we can pass the styles from that directly to the handy `css` prop
	css: text( { variant } ).styles,
	// mostly className and children
	...restProps,
} );

/* eslint-disable jsdoc/valid-types */
/**
 * @param {import('react').ForwardRefExoticComponent<AdaptedTextProps>} Current
 */
/* eslint-enable jsdoc/valid-types */
export function withNextComponent( Current ) {
	return withNext( Current, Text, 'WPComponentsText', adapter );
}
