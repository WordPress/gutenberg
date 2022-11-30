/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { TextareaControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';

function CustomCSSControl() {
	const [ customCSS, updateCSS ] = useState();
	const { record, hasResolved, edit, save } = useEntityRecord(
		'postType',
		'custom_css'
	);

	useEffect( () => {
		if ( hasResolved ) {
			updateCSS( record?.post_content );
		}
	}, [ hasResolved, record ] );

	function updateCustomCSS() {
		edit( {
			custom_css: customCSS,
		} );
		save();
	}

	if ( ! hasResolved ) {
		return __( 'Loading' );
	}

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
