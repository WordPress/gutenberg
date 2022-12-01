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
		<>
			<TextareaControl
				value={ customCSS }
				onChange={ ( value ) => setCustomCSS( value ) }
			/>
		</>
	);
}

export default CustomCSSControl;
