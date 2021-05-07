/**
 * External dependencies
 */
import { css, cx } from 'emotion';
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

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
import type { ViewOwnProps } from '../ui/context';
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
	 * The amount of space between each child element.
	 *
	 * @default 0
	 */
	offset?: number;
}

function ZStack(
	props: ViewOwnProps< ZStackProps, 'div' >,
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
	const childrenCount = validChildren.length - 1;

	const clonedChildren = validChildren.map( ( child, index ) => {
		const zIndex = isReversed ? childrenCount - index : index;

		const classes = cx(
			isLayered ? styles.positionAbsolute : styles.positionRelative,
			css( {
				marginLeft: ! isLayered && offset * -1,
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

	const classes = cx(
		css( {
			paddingLeft: ! isLayered ? offset : null,
		} ),
		className
	);

	return (
		<ZStackView
			{ ...otherProps }
			className={ classes }
			ref={ forwardedRef }
		>
			{ clonedChildren }
		</ZStackView>
	);
}

export default contextConnect( ZStack, 'ZStack' );
