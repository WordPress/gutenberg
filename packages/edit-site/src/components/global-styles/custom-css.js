/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { TextareaControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function CustomCSSControl() {
	const [ customCSS, updateCSS ] = useState();

	function updateCustomCSS() {}

	return (
		<>
			<TextareaControl
				value={ customCSS }
				onChange={ ( value ) => updateCSS( value ) }
			/>
			<Button
				isPrimary
				onClick={ () => updateCustomCSS() }
				label={ __( 'Save' ) }
			>
				{ __( 'Save' ) }
			</Button>
		</>
	);
}

export default CustomCSSControl;
