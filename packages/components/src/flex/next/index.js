/**
 * Internal dependencies
 */
import { __unstableWithNext as withNext } from '../../__next/context';
import NextFlex from './flex';
import NextFlexBlock from './flex-block';
import NextFlexItem from './flex-item';

export * from './use-flex';
export * from './use-flex-block';
export * from './use-flex-item';

const Flex = process.env.COMPONENT_SYSTEM_PHASE === 1 ? NextFlex : undefined;
const FlexBlock =
	process.env.COMPONENT_SYSTEM_PHASE === 1 ? NextFlexBlock : undefined;
const FlexItem =
	process.env.COMPONENT_SYSTEM_PHASE === 1 ? NextFlexItem : undefined;

/**
 * @param {import('../index').Props} props Current props.
 * @return {import('./types').FlexProps} Next props.
 */
const flexAdapter = ( { isReversed, ...restProps } ) => ( {
	// There's no equivalent for `direction` on the original component so we can just translate `isReversed` to it
	direction: isReversed ? 'row-reverse' : 'row',
	...restProps,
	// There's an HTML attribute named `wrap` that will exist in `restProps` so we need to set it to undefined so the default behavior of the next component takes over
	wrap: undefined,
} );

/**
 * @param {import('../item').Props} props Current props.
 * @return {import('./types').FlexItemProps} Next props.
 */
const flexItemAdapter = ( props ) => ( {
	...props,
	// ensure these are undefined so the default takes over
	isBlock: undefined,
	display: undefined,
} );

/**
 * @param {import('../block').Props} props Current props.
 * @return {import('./types').FlexBlockProps} Next props.
 */
const flexBlockAdapter = ( props ) => ( {
	...props,
	// ensure this is undefined so the default takes over
	display: undefined,
} );

/* eslint-disable jsdoc/valid-types */
/**
 * @param {import('react').ForwardRefExoticComponent<import('../index').Props>} Current
 */
/* eslint-enable jsdoc/valid-types */
export function withNextFlex( Current ) {
	return withNext( Current, Flex, 'WPComponentsFlex', flexAdapter );
}

/* eslint-disable jsdoc/valid-types */
/**
 * @param {import('react').ForwardRefExoticComponent<import('../item').Props>} Current
 */
/* eslint-enable jsdoc/valid-types */
export function withNextFlexItem( Current ) {
	return withNext( Current, FlexItem, 'WPComponentsFlex', flexItemAdapter );
}

/* eslint-disable jsdoc/valid-types */
/**
 * @param {import('react').ForwardRefExoticComponent<import('../block').Props>} Current
 */
/* eslint-enable jsdoc/valid-types */
export function withNextFlexBlock( Current ) {
	return withNext( Current, FlexBlock, 'WPComponentsFlex', flexBlockAdapter );
}
