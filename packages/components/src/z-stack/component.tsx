import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { isValidElement } from '@wordpress/element';
import { getValidChildren } from '../utils/get-valid-children';
import { contextConnect, useContextSystem } from '../context';
import { PolymorphicElement } from '../utils/polymorphic-element';
import styles from './style.module.scss';
import type { ZStackProps } from './types';
import type { WordPressComponentProps } from '../context';

function UnconnectedZStack(
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
		// Only when the component is layered, the offset needs to be multiplied by
		// the item's index, so that items can correctly stack at the right distance
		const offsetAmount = isLayered ? offset * index : offset;

		const key = isValidElement( child ) ? child.key : index;

		return (
			<div
				className={ styles.child }
				style={ {
					'--z-stack-offset': `${ offsetAmount }px`,
					'--z-stack-z-index': zIndex,
				} }
				key={ key }
			>
				{ child }
			</div>
		);
	} );

	return (
		<PolymorphicElement
			{ ...otherProps }
			className={ clsx(
				styles[ 'z-stack' ],
				isLayered && styles.layered,
				className
			) }
			ref={ forwardedRef }
		>
			{ clonedChildren }
		</PolymorphicElement>
	);
}

/**
 * `ZStack` allows you to stack things along the Z-axis.
 *
 * ```jsx
 * import { __experimentalZStack as ZStack } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <ZStack offset={ 20 } isLayered>
 *       <ExampleImage />
 *       <ExampleImage />
 *       <ExampleImage />
 *     </ZStack>
 *   );
 * }
 * ```
 */
export const ZStack = contextConnect( UnconnectedZStack, 'ZStack' );

export default ZStack;
