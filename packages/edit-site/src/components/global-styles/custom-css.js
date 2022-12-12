/**
 * WordPress dependencies
 */
import { TextareaControl, Panel, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useStyle } from './hooks';

function CustomCSSControl() {
	const [ customCSS, setCustomCSS ] = useStyle( 'css' );
	const [ themeCSS ] = useStyle( 'css', null, 'base' );
	const ignoreThemeCustomCSS = '/* IgnoreThemeCustomCSS */';

	const themeCustomCSS =
		! customCSS && themeCSS
			? `/* ${ __(
					'Theme Custom CSS start'
			  ) } */\n${ themeCSS }\n/* ${ __( 'Theme Custom CSS end' ) } */`
			: undefined;

	function handleOnChange( value ) {
		if ( themeCSS && value === '' ) {
			setCustomCSS( ignoreThemeCustomCSS );
			return;
		}
		setCustomCSS( value );
	}

	const originalThemeCustomCSS =
		themeCSS && customCSS && themeCustomCSS !== customCSS
			? themeCSS
			: undefined;

	return (
		<>
			<TextareaControl
				value={
					customCSS?.replace( ignoreThemeCustomCSS, '' ) ||
					themeCustomCSS
				}
				onChange={ ( value ) => handleOnChange( value ) }
				rows={ 15 }
				className="edit-site-global-styles__custom-css-input"
			/>
			{ originalThemeCustomCSS && (
				<Panel>
					<PanelBody
						title={ __( 'Original Theme Custom CSS' ) }
						initialOpen={ false }
					>
						<pre className="edit-site-global-styles__custom-css-theme-css">
							{ originalThemeCustomCSS }
						</pre>
					</PanelBody>
				</Panel>
			) }
		</>
	);
}

export default CustomCSSControl;
