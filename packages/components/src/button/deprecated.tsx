/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '.';
import type { ButtonProps, DeprecatedIconButtonProps, TagName } from './types';
import type { WordPressComponentProps } from '../ui/context';

function UnforwardedIconButton(
	{
		label,
		labelPosition,
		size,
		tooltip,
		...props
	}: WordPressComponentProps<
		ButtonProps & DeprecatedIconButtonProps,
		TagName
	>,
	ref: ForwardedRef< any >
) {
	deprecated( 'wp.components.IconButton', {
		since: '5.4',
		alternative: 'wp.components.Button',
		version: '6.2',
	} );

	return (
		<Button
			{ ...props }
			ref={ ref }
			tooltipPosition={ labelPosition }
			iconSize={ size }
			showTooltip={ tooltip !== undefined ? !! tooltip : undefined }
			label={ tooltip || label }
		/>
	);
}

export default forwardRef( UnforwardedIconButton );
