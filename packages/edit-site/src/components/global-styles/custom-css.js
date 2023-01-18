/**
 * WordPress dependencies
 */
import {
	ExternalLink,
	TextareaControl,
	Panel,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { lazy, Suspense } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useStyle } from './hooks';

const CSSEditor = lazy( () => import( './css-editor' ) );
function CustomCSSControl() {
	const [ customCSS, setCustomCSS ] = useStyle( 'css' );
	const [ themeCSS ] = useStyle( 'css', null, 'base' );
	const ignoreThemeCustomCSS = '/* IgnoreThemeCustomCSS */';

	// If there is custom css from theme.json show it in the edit box
	// so the user can selectively overwrite it, rather than have the user CSS
	// completely overwrite the theme CSS by default.
	const themeCustomCSS =
		! customCSS && themeCSS
			? `/* ${ __(
					'Theme Custom CSS start'
			  ) } */\n${ themeCSS }\n/* ${ __( 'Theme Custom CSS end' ) } */`
			: undefined;

	function handleOnChange( value ) {
		// If there is theme custom CSS, but the user clears the input box then save the
		// ignoreThemeCustomCSS string so that the theme custom CSS is not re-applied.
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
			<Suspense>
				<CSSEditor
					value={
						customCSS?.replace( ignoreThemeCustomCSS, '' ) ||
						themeCustomCSS
					}
					onChange={ handleOnChange }
				/>
			</Suspense>
			<ExternalLink href="https://wordpress.org/support/article/css/">
				{ __( 'Learn more about CSS' ) }
			</ExternalLink>

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
