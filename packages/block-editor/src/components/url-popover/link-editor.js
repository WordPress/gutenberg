/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	IconButton,
} from '@wordpress/components';

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
			className={ classnames(
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
			<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
		</form>
	);
}
