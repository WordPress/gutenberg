/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
 * EditorView provided by CodeMirror
 * 
 * @param {Object} props
 * @param {string} props.content - Text content of the editor.
 * @param {string} props.editorId
 * @param {string} props.editorInstructionsId
 * @param {string} props.editorInstructionsText - Instructions text for accessibility.
 * @param {Function} props.onChange - Callback for when the content changes.
 * @param {Function} [props.onBlur] - Callback for when the editor loses focus.
 * @param {string} props.mode - Language mode for the editor. Currently supports 'css' and 'html'.
 */
const EditorView = ({content, editorId, editorInstructionsId, editorInstructionsText, onChange, onBlur, mode}) => {
	const editorRef = useRef(null);
	useEffect( () => {
		( async () => {
			/**
			 * Lazy load CodeMirror by using Webpack's dynamic import.
			 * This should be replaced with native dynamic import once it's supported.
			 * @see https://github.com/WordPress/gutenberg/pull/60155
			 */
			const [{ EditorView: CmEditorView, basicSetup }, { indentWithTab }, { keymap }, languageSupport] = 
				await Promise.all([
					import( 'codemirror' ), 
					import( '@codemirror/commands' ), 
					import( '@codemirror/view' ),
					importLanguageSupport( mode )
				])

			if ( editorRef.current ) {
				new CmEditorView( {
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
					],
					parent: editorRef.current,
				} );
			}
		} )();
		// We only want to run this once, so we can ignore the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
	return (
		<>
			<div
				id={ editorInstructionsId }
				className={ editorInstructionsId }
				style={ { display: 'none' } }
			>
				{ editorInstructionsText }
				{ __(
					`Press Escape then Tab to move focus out of the editor.`
				) }
			</div>
			<div
				ref={ editorRef }
				id={ editorId }
				className={ editorId }
				aria-describedby={ editorInstructionsId }
			></div>
		</>
	);
};

export default EditorView;