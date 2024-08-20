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

export default function AdvancedPanel( {
	value,
	onChange,
	inheritedValue = value,
} ) {
	// Custom CSS
	const [ cssError, setCSSError ] = useState( null );
	const customCSS = inheritedValue?.css;
	function handleOnChange( newValue ) {
		onChange( {
			...value,
			css: newValue,
		} );
		if ( cssError ) {
			// Check if the new value is valid CSS, and pass a wrapping selector
			// to ensure that `transformStyles` validates the CSS. Note that the
			// wrapping selector here is not used in the actual output of any styles.
			const [ transformed ] = transformStyles(
				[ { css: newValue } ],
				'.for-validation-only'
			);
			if ( transformed ) {
				setCSSError( null );
			}
		}
	}
	function handleOnBlur( event ) {
		if ( ! event?.target?.value ) {
			setCSSError( null );
			return;
		}

		// Check if the new value is valid CSS, and pass a wrapping selector
		// to ensure that `transformStyles` validates the CSS. Note that the
		// wrapping selector here is not used in the actual output of any styles.
		const [ transformed ] = transformStyles(
			[ { css: event.target.value } ],
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
				__nextHasNoMarginBottom
				value={ customCSS }
				onChange={ ( newValue ) => handleOnChange( newValue ) }
				onBlur={ handleOnBlur }
				className="block-editor-global-styles-advanced-panel__custom-css-input"
				spellCheck={ false }
			/>
		</VStack>
	);
}
