/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { TextareaControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

function CustomCSSControl() {
	const [ updatedCSS, updateCSS ] = useState();
	const customCSS = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		return getEntityRecord( 'postType', 'custom_css' )?.post_content;
	} );

	const { saveEntityRecord } = useDispatch( coreStore );

	function updateCustomCSS() {
		saveEntityRecord( 'postType', 'custom_css', {
			custom_css: updatedCSS,
		} );
	}

	return (
		<>
			<TextareaControl
				value={ updatedCSS || customCSS }
				onChange={ ( value ) => updateCSS( value ) }
			/>
			<Button
				isPrimary
				onClick={ () => updateCustomCSS() }
				label={ __( 'Update' ) }
			>
				{ __( 'Update' ) }
			</Button>
		</>
	);
}

export default CustomCSSControl;
