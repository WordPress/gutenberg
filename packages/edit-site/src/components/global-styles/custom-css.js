/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	TextareaControl,
	Panel,
	PanelBody,
	__experimentalVStack as VStack,
	Tooltip,
	Icon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	experiments as blockEditorExperiments,
	transformStyles,
} from '@wordpress/block-editor';
import { info } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../experiments';
import Subtitle from './subtitle';

const { useGlobalStyle } = unlock( blockEditorExperiments );
function CustomCSSControl( { blockName } ) {
	// If blockName is defined, we are customizing CSS at the block level:
	// styles.blocks.blockName.css
	const block = !! blockName ? blockName : null;

	const [ customCSS, setCustomCSS ] = useGlobalStyle( 'css', block );
	const [ themeCSS ] = useGlobalStyle( 'css', block, 'base' );
	const [ cssError, setCSSError ] = useState( null );
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
		if ( cssError ) {
			const [ transformed ] = transformStyles(
				[ { css: value } ],
				'.editor-styles-wrapper'
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

		const [ transformed ] = transformStyles(
			[ { css: event.target.value } ],
			'.editor-styles-wrapper'
		);

		setCSSError(
			transformed === null
				? __( 'There is an error with your CSS structure.' )
				: null
		);
	}

	const originalThemeCustomCSS =
		themeCSS && customCSS && themeCustomCSS !== customCSS
			? themeCSS
			: undefined;

	return (
		<>
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
			<VStack spacing={ 3 }>
				<Subtitle>{ __( 'Additional CSS' ) }</Subtitle>
				<TextareaControl
					__nextHasNoMarginBottom
					value={
						customCSS?.replace( ignoreThemeCustomCSS, '' ) ||
						themeCustomCSS
					}
					onChange={ ( value ) => handleOnChange( value ) }
					onBlur={ handleOnBlur }
					className="edit-site-global-styles__custom-css-input"
					spellCheck={ false }
				/>
				{ cssError && (
					<Tooltip text={ cssError }>
						<div className="edit-site-global-styles__custom-css-validation-wrapper">
							<Icon
								icon={ info }
								className="edit-site-global-styles__custom-css-validation-icon"
							/>
						</div>
					</Tooltip>
				) }
			</VStack>
		</>
	);
}

export default CustomCSSControl;
