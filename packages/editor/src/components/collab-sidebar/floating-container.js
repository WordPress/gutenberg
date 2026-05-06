/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Stack } from '@wordpress/ui';

export function FloatingContainer( {
	floating,
	className,
	style,
	children,
	...props
} ) {
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
