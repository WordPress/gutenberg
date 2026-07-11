/**
 * External dependencies
 */
import clsx from 'clsx';
import type { CSSProperties, ReactNode, Ref } from 'react';

/**
 * WordPress dependencies
 */
import { Stack } from '@wordpress/ui';

/**
 * Position handle for a floating note thread: the computed top offset and a
 * ref to the floating element so the board can measure it.
 */
export interface FloatingPosition {
	y?: number;
	ref?: Ref< any >;
}

type FloatingContainerProps = {
	floating?: FloatingPosition;
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
} & Record< string, any >;

export function FloatingContainer( {
	floating,
	className,
	style,
	children,
	...props
}: FloatingContainerProps ) {
	const isFloating = !! floating;
	return (
		<Stack
			direction="column"
			className={ clsx( className, { 'is-floating': isFloating } ) }
			ref={ isFloating ? floating.ref : undefined }
			style={ isFloating ? { top: floating.y, ...style } : style }
			{ ...props }
		>
			{ children }
		</Stack>
	);
}
