/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { contextConnect, useContextSystem } from '../context';
import { space } from '../utils/space';
import type { DividerProps } from './types';
import styles from './style.module.scss';

function UnconnectedDivider(
	props: WordPressComponentProps< DividerProps, 'hr', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		className,
		margin,
		marginEnd,
		marginStart,
		style,
		...contextProps
	} = useContextSystem( props, 'Divider' );

	const dividerStyle = { ...style };
	const resolvedMarginStart = space( marginStart ?? margin );
	const resolvedMarginEnd = space( marginEnd ?? margin );

	if ( resolvedMarginStart ) {
		dividerStyle[ '--wp-components-divider-margin-start' ] =
			resolvedMarginStart;
	}

	if ( resolvedMarginEnd ) {
		dividerStyle[ '--wp-components-divider-margin-end' ] =
			resolvedMarginEnd;
	}

	return (
		<Ariakit.Separator
			className={ clsx( styles.divider, className ) }
			style={ dividerStyle }
			{ ...contextProps }
			ref={ forwardedRef }
		/>
	);
}

/**
 * `Divider` is a layout component that separates groups of related content.
 *
 * ```js
 * import {
 * 		__experimentalDivider as Divider,
 * 		__experimentalText as Text,
 * 		__experimentalVStack as VStack,
 * } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<VStack spacing={4}>
 * 			<Text>Some text here</Text>
 * 			<Divider />
 * 			<Text>Some more text here</Text>
 * 		</VStack>
 * 	);
 * }
 * ```
 */
export const Divider = contextConnect( UnconnectedDivider, 'Divider' );

export default Divider;
