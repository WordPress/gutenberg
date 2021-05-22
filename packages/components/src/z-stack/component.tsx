/**
 * External dependencies
 */
import { css, cx } from 'emotion';
// eslint-disable-next-line no-restricted-imports
import type { Ref, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getValidChildren } from '../ui/utils/get-valid-children';
import { contextConnect, useContextSystem } from '../ui/context';
// eslint-disable-next-line no-duplicate-imports
import type { PolymorphicComponentProps } from '../ui/context';
import { View } from '../view';
import * as styles from './styles';
const { ZStackView } = styles;

export interface ZStackProps {
	/**
	 * Layers children elements on top of each other (first: highest z-index, last: lowest z-index).
	 *
	 * @default true
	 */
	isLayered?: boolean;
	/**
	 * Reverse the layer ordering (first: lowest z-index, last: highest z-index).
	 *
	 * @default false
	 */
	isReversed?: boolean;
	/**
	 * The amount of offset between each child element.
	 *
	 * @default 0
	 */
	offset?: number;
	/**
	 * Child elements.
	 */
	children: ReactNode;
}

function ZStack(
	props: PolymorphicComponentProps< ZStackProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const {
		children,
		className,
		isLayered = true,
		isReversed = false,
		offset = 0,
		...otherProps
	} = useContextSystem( props, 'ZStack' );

	const validChildren = getValidChildren( children );
	const childrenLastIndex = validChildren.length - 1;

	const clonedChildren = validChildren.map( ( child, index ) => {
		const zIndex = isReversed ? childrenLastIndex - index : index;
		const offsetAmount = offset * index;

		const classes = cx(
			isLayered ? styles.positionAbsolute : styles.positionRelative,
			css( {
				...( isLayered
					? { marginLeft: offsetAmount }
					: { right: offsetAmount * -1 } ),
			} )
		);

		const key = isValidElement( child ) ? child.key : index;

		return (
			<View
				className={ classes }
				key={ key }
				style={ {
					zIndex,
				} }
			>
				{ child }
			</View>
		);
	} );

	return (
		<ZStackView
			{ ...otherProps }
			className={ className }
			ref={ forwardedRef }
		>
			{ clonedChildren }
		</ZStackView>
	);
}

export default contextConnect( ZStack, 'ZStack' );
