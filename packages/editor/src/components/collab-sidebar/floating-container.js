/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';

export function FloatingContainer( {
	floating,
	className,
	style,
	children,
	...props
} ) {
	const isFloating = !! floating;
	return (
		<VStack
			className={ clsx( className, { 'is-floating': isFloating } ) }
			ref={ isFloating ? floating.refs.setFloating : undefined }
			style={ isFloating ? { top: floating.y, ...style } : style }
			{ ...props }
		>
			{ children }
		</VStack>
	);
}
