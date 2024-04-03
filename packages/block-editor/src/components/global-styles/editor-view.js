/**
 * WordPress dependencies
 */
import { VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Dynamically import the language support for the editor.
 * 
 * @param {string} mode - Language mode for the editor. Currently supports 'css' and 'html'.
 */
function importLanguageSupport( mode ) {
	switch ( mode ) {
		case 'css':
			return import( '@codemirror/lang-css' );
		case 'html':
			return import( '@codemirror/lang-html' );
		default:
			return import( '@codemirror/lang-css' );
	}
}

/**
 * @typedef {Object} Config
 * @property {Function} [callback] - Callback after the editor is initialized.
 * @property {string}   content    - Text content of the editor.
 * @property {Function} onChange   - Callback for when the content changes.
 * @property {Function} [onBlur]   - Callback for when the editor loses focus.
 * @property {string}   mode       - Language mode for the editor. Currently supports 'css' and 'html'.
 */

/**
 * EditorView provided by CodeMirror
 *
 * @param {Object} props
 * @param {string} props.editorId
 * @param {string} [props.editorInstructionsText] - Instructions text for accessibility.
 * @param {Config} props.initialConfig            - Initial configuration for the editor. This can only be used for the initial setup of the editor.
 */
const EditorView = ({
	editorId,
	editorInstructionsText, 
	initialConfig: {
		callback,
		content,
		onChange,
		onBlur,
		mode,
	},
}) => {
	const editorRef = useRef(null);
	const instanceId = useInstanceId( EditorView );
	useEffect( () => {
		( async () => {
			/**
			 * Lazy load CodeMirror by using Webpack's dynamic import.
			 * This should be replaced with native dynamic import once it's supported.
			 * @see https://github.com/WordPress/gutenberg/pull/60155
			 */
			const [{ EditorView: CmEditorView, basicSetup }, { indentWithTab }, { Compartment }, { keymap }, languageSupport] = 
				await Promise.all([
					import( 'codemirror' ), 
					import( '@codemirror/commands' ), 
					import( '@codemirror/state' ),
					import( '@codemirror/view' ),
					importLanguageSupport( mode )
				])

			if ( editorRef.current ) {
				const isDarkTheme = editorRef.current.closest( '.is-dark-theme' );
				const theme = new Compartment();
				const view = new CmEditorView( {
					doc: content,
					extensions: [
						basicSetup,
						languageSupport[mode](),
						keymap.of( [ indentWithTab ] ),
						CmEditorView.updateListener.of( ( editor ) => {
							if ( editor.docChanged ) {
								onChange( editor.state.doc.toString() );
							}
						} ),
						...(onBlur ?
						[CmEditorView.focusChangeEffect.of(
							( editorState, focusing ) => {
								if ( ! focusing ) {
									onBlur( editorState.doc.toString() );
								}
								return null;
							}
						)] : []),
						theme.of(CmEditorView.theme({}, { dark: isDarkTheme })),
					],
					parent: editorRef.current,
				} );

				/**
				 * Observe `body` to detect dark theme changes.
				 */
				const observer = new window.MutationObserver( ( mutations ) => {
					mutations.forEach( ( mutation ) => {
						if ( mutation.attributeName === 'class' ) {
							view.dispatch({
								effects: theme.reconfigure(CmEditorView.theme({}, { dark: editorRef.current.closest( '.is-dark-theme' ) })),
							});
						}
					});
				});
				observer.observe( 
					editorRef.current.closest( 'body' ),
					{ attributes: true } 
				);

				if (typeof callback === 'function') {
					callback();
				}
			}
		} )();
		// We only want to run this once when the editor is initialized, so we can ignore the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
	return (
		<>
			{editorInstructionsText && (<VisuallyHidden
				id={ instanceId }
			>
				{ editorInstructionsText }
				{ __(
					`Press Escape then Tab to move focus out of the editor.`
				) }
			</VisuallyHidden>)}
			<div
				ref={ editorRef }
				id={ editorId }
				className={ editorId }
				aria-describedby={ instanceId }
			></div>
		</>
	);
};

export default EditorView;