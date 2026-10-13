import {
	TextareaControl as WCTextareaControl,
	Notice,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	inheritedValue,
	help,
} ) {
	// Custom CSS. Prefer the local override in `value` (scoped to the
	// currently selected style state); when there isn't one, fall back to
	// `inheritedValue` (e.g. the theme.json + user merged CSS for that same
	// state) so the field previews what already applies, same as other
	// inheritable style controls. Falls back to an empty string, never
	// `undefined`, so the textarea doesn't retain a previous state's
	// uncontrolled DOM value when switching between style states.
	const hasOwnCSS = typeof value?.css === 'string' && value.css.trim() !== '';
	const customCSS = ( hasOwnCSS ? value.css : inheritedValue?.css ) ?? '';
	const [ cssError, setCSSError ] = useState( () =>
		getCSSValidationError( customCSS )
	);

	// Tracks the last value this component itself produced via onChange/onBlur,
	// so the effect below can tell an external change (e.g. switching to a
	// different style state) apart from the change it just caused itself.
	const ownValueRef = useRef( customCSS );

	// Re-validate whenever the edited CSS changes for a reason other than
	// this component's own onChange/onBlur handlers, e.g. switching to a
	// different style state. Skipping the component's own changes keeps the
	// full (slower) validation off the hot typing path; it already runs via
	// handleOnChange/handleOnBlur below.
	useEffect( () => {
		if ( customCSS === ownValueRef.current ) {
			return;
		}
		ownValueRef.current = customCSS;
		setCSSError( getCSSValidationError( customCSS ) );
	}, [ customCSS ] );

	function handleOnChange( newValue ) {
		ownValueRef.current = newValue;
		onChange( {
			...value,
			css: newValue,
		} );

		setCSSError( getMarkupValidationError( newValue ) );
	}
	function handleOnBlur( event ) {
		const newValue = event?.target?.value;
		ownValueRef.current = newValue;
		setCSSError( getCSSValidationError( newValue ) );
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
			<WCTextareaControl
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
