/**
 * WordPress dependencies
 */
import { VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
const EditorView = ( {
	editorId,
	editorInstructionsText,
	initialConfig: { callback, content, onChange, onBlur, mode },
} ) => {
	const editorRef = useRef( null );
	const instanceId = useInstanceId( EditorView );

	useEffect( () => {
		import( /* webpackChunkName: "codemirror" */ './code-mirror' )
			.then( ( { default: createEditorView } ) => {
				if ( editorRef.current ) {
					return createEditorView( {
						parent: editorRef.current,
						mode,
						content,
						onChange,
						onBlur,
					} );
				}
			} )
			.then( () => {
				if ( typeof callback === 'function' ) {
					callback();
				}
			} );
		// We only want to run this once, so we can ignore the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<>
			{ editorInstructionsText && (
				<VisuallyHidden id={ instanceId }>
					{ editorInstructionsText }
					{ __(
						`Press Escape then Tab to move focus out of the editor.`
					) }
				</VisuallyHidden>
			) }
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
