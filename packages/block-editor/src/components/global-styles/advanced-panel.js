/**
 * WordPress dependencies
 */
import { TextareaControl, Notice } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
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

/**
 * Returns the error message string if the CSS contains HTML markup, or null if it is clean.
 *
 * @param {string} css The CSS string to check.
 * @return {string|null} An error message, or null if the CSS is valid.
 */
function getMarkupValidationError( css ) {
	return validateCSS( css )
		? null
		: __( 'The custom CSS is invalid. Do not use <> markup.' );
}

/**
 * Full CSS validation: markup check first (fast), then a CSS parser (slower).
 *
 * @param {string} css The CSS string to validate.
 * @return {string|null} An error message, or null if the CSS is valid.
 */
function getCSSValidationError( css ) {
	if ( ! css ) {
		return null;
	}
	const markupError = getMarkupValidationError( css );
	if ( markupError ) {
		return markupError;
	}
	const [ transformed ] = transformStyles(
		[ { css } ],
		'.for-validation-only'
	);
	return transformed === null
		? __( 'There is an error with your CSS structure.' )
		: null;
}

export default function AdvancedPanel( {
	value,
	onChange,
	inheritedValue = value,
	help,
} ) {
	// Custom CSS
	const customCSS = inheritedValue?.css;
	const [ cssError, setCSSError ] = useState( () =>
		getCSSValidationError( customCSS )
	);
	function handleOnChange( newValue ) {
		onChange( {
			...value,
			css: newValue,
		} );

		setCSSError( getMarkupValidationError( newValue ) );
	}
	function handleOnBlur( event ) {
		setCSSError( getCSSValidationError( event?.target?.value ) );
	}

	return (
		<Stack
			direction="column"
			gap="md"
			className="block-editor-global-styles-advanced-panel"
		>
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
		</Stack>
	);
}
