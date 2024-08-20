/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { keyboardReturn } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import URLInput from '../url-input';

export default function LinkEditor( {
	autocompleteRef,
	className,
	onChangeInputValue,
	value,
	...props
} ) {
	return (
		<form
			className={ clsx(
				'block-editor-url-popover__link-editor',
				className
			) }
			{ ...props }
		>
			<URLInput
				value={ value }
				onChange={ onChangeInputValue }
				autocompleteRef={ autocompleteRef }
			/>
			<Button
				icon={ keyboardReturn }
				label={ __( 'Apply' ) }
				type="submit"
				size="compact"
			/>
		</form>
	);
}
