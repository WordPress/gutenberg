/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Flex } from '@wordpress/components';

function ColorIndicatorWrapper( { className, ...props } ) {
	return (
		<Flex
			className={ classnames(
				'edit-site-global-styles__color-indicator-wrapper',
				className
			) }
			{ ...props }
		/>
	);
}

export default ColorIndicatorWrapper;
