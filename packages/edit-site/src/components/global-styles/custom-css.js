/**
 * WordPress dependencies
 */
import { TextareaControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useStyle } from './hooks';

function CustomCSSControl() {
	const [ customCSS, setCustomCSS ] = useStyle( 'css' );

	return (
		<TextareaControl
			value={ customCSS }
			onChange={ ( value ) => setCustomCSS( value ) }
			rows={ 15 }
			className="edit-site-global-styles__custom-css-input"
		/>
	);
}

export default CustomCSSControl;
