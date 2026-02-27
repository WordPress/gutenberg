/**
 * WordPress dependencies
 */
import {
	TextareaControl,
	Notice,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as transformStyles } from '../../utils/transform-styles';

/**
 * Validates that a CSS string doesn't contain HTML markup.
 * Uses the same validation as the PHP/global styles REST API.
 *
 * @param {string} css The CSS string to validate.
 * @return {boolean} True if the CSS is valid, false otherwise.
 */
export function validateCSS( css ) {
	// Check for HTML markup.
	if ( typeof css === 'string' && /<\/?\w/.test( css ) ) {
		return false;
	}
	return true;
}

export default function AdvancedPanel( {
	value,
	onChange,
	inheritedValue = value,
	help,
} ) {
	// Custom CSS
	const [ cssError, setCSSError ] = useState( null );
	const customCSS = inheritedValue?.css;
	function handleOnChange( newValue ) {
		onChange( {
			...value,
			css: newValue,
		} );

		// Validate immediately on change for quick feedback.
		if ( ! validateCSS( newValue ) ) {
			setCSSError(
				__( 'The custom CSS is invalid. Do not use <> markup.' )
			);
			return;
		}

		// Clear HTML markup error if CSS is now valid.
		if ( cssError ) {
			setCSSError( null );
		}
	}
	function handleOnBlur( event ) {
		const cssValue = event?.target?.value;

		if ( ! cssValue || ! validateCSS( cssValue ) ) {
			return;
		}

		// Check if the value is valid CSS structure on blur (more expensive check).
		// Pass a wrapping selector to ensure that `transformStyles` validates the CSS.
		// Note that the wrapping selector here is not used in the actual output of any styles.
		const [ transformed ] = transformStyles(
			[ { css: cssValue } ],
			'.for-validation-only'
		);

		setCSSError(
			transformed === null
				? __( 'There is an error with your CSS structure.' )
				: null
		);
	}

	return (
		<VStack spacing={ 3 }>
			{ cssError && (
				<Notice status="error" onRemove={ () => setCSSError( null ) }>
					{ cssError }
				</Notice>
			) }
			<TextareaControl
				label={ __( 'Additional CSS' ) }
				value={ customCSS }
				onChange={ ( newValue ) => handleOnChange( newValue ) }
				onBlur={ handleOnBlur }
				className="block-editor-global-styles-advanced-panel__custom-css-input"
				spellCheck={ false }
				help={ help }
			/>
		</VStack>
	);
}
