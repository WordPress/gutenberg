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
	return (
		<>
			<TextareaControl
				value={ customCSS }
				onChange={ ( value ) => setCustomCSS( value ) }
				rows={ 15 }
				className="edit-site-global-styles__custom-css-input"
				spellCheck={ false }
				help={ __(
					"Enter your custom CSS in the textarea and preview in the editor. Changes won't take effect until you've saved the template."
				) }
			/>
			{ themeCSS && (
				<Panel>
					<PanelBody
						title={ __( 'Theme Custom CSS' ) }
						initialOpen={ false }
					>
						<pre className="edit-site-global-styles__custom-css-theme-css">
							{ themeCSS }
						</pre>
					</PanelBody>
				</Panel>
			) }
		</>
	);
}

export default CustomCSSControl;
