/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Flex } from '@wordpress/components';

interface ColorIndicatorWrapperProps {
	className?: string;
	[ key: string ]: any;
}

function ColorIndicatorWrapper( {
	className,
	children,
	...props
}: ColorIndicatorWrapperProps ) {
	return (
		<Flex
			className={ clsx(
				'global-styles-ui__color-indicator-wrapper',
				className
			) }
			{ ...props }
		>
			{ children }
		</Flex>
	);
}

export default ColorIndicatorWrapper;
