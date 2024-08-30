/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Flex } from '@wordpress/components';

function ColorIndicatorWrapper( { className, ...props } ) {
	return (
		<Flex
			className={ clsx(
				'edit-site-global-styles__color-indicator-wrapper',
				className
			) }
			{ ...props }
		/>
	);
}

export default ColorIndicatorWrapper;
