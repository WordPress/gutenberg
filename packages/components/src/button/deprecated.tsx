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
import type { DeprecatedIconButtonProps } from './types';

function UnforwardedIconButton(
	{
		label,
		labelPosition,
		size,
		tooltip,
		...props
	}: React.ComponentPropsWithoutRef< typeof Button > &
		DeprecatedIconButtonProps,
	ref: ForwardedRef< any >
) {
	deprecated( 'wp.components.IconButton', {
		since: '5.4',
		alternative: 'wp.components.Button',
		version: '6.2',
	} );

	return (
		// Disable reason: the parent component is taking care of the __next40pxDefaultSize prop.
		// eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
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
