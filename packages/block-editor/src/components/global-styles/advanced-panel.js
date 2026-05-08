/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Notice,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { lazy, Suspense, useId, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as transformStyles } from '../../utils/transform-styles';

const CodeMirrorEditor = lazy( async () => {
	const [ codemirrorModule, editorModule ] = await Promise.all( [
		import( '@wordpress/codemirror' ),
		import( './codemirror-editor' ),
	] );
	editorModule.setCodemirror(
		codemirrorModule.__WORDPRESS_PRIVATE_DO_NOT_USE
	);
	return editorModule;
} );

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
	cssDeclarationsList = false,
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
	function handleOnBlur( cssValue ) {
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
			<BaseControl
				className="block-editor-global-styles-advanced-panel__base-control"
				label={ __( 'Additional CSS' ) }
				help={ help }
				id={ useId() }
			>
				<Suspense fallback={ null }>
					<CodeMirrorEditor
						label={ __( 'Additional CSS' ) }
						value={ customCSS }
						onChange={ handleOnChange }
						onBlur={ handleOnBlur }
						className="block-editor-global-styles-advanced-panel__custom-css-input"
						cssDeclarationsList={ cssDeclarationsList }
					/>
				</Suspense>
			</BaseControl>
		</VStack>
	);
}
