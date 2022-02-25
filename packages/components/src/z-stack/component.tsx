/**
 * External dependencies
 */
import type { ForwardedRef, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getValidChildren } from '../ui/utils/get-valid-children';
import { contextConnect, useContextSystem } from '../ui/context';
import type { WordPressComponentProps } from '../ui/context';
import { ZStackView, ZStackChildView } from './styles';

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
	 * The amount of offset between each child element. The amount of space between each child element. Defaults to `0`. Its value is automatically inverted (i.e. from positive to negative, and viceversa) when switching from LTR to RTL.
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
	props: WordPressComponentProps< ZStackProps, 'div' >,
	forwardedRef: ForwardedRef< any >
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

		const key = isValidElement( child ) ? child.key : index;

		return (
			<ZStackChildView
				isLayered={ isLayered }
				offsetAmount={ offsetAmount }
				zIndex={ zIndex }
				key={ key }
			>
				{ child }
			</ZStackChildView>
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
