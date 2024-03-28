/**
 * External dependencies
 */
import { EditorView as CmEditorView, basicSetup } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { css } from '@codemirror/lang-css';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const EditorView = ({editorId, editorInstructionsId, customCSS, onChange, onBlur}) => {
	/**
	 * Ensure the editor has at least min lines of code,
	 * as the editor will shrink to fit the content.
	 * @param {string} content The content to ensure min lines for.
	 * @return {string} The content with at least min lines.
	 */
	function ensureMinLines( content ) {
		const MIN_LINES = 10;
		const LINE_HEIGHT = 18.2; // Height of one line in the editor
		const MARGIN = 53.4;
		let requiredLines = MIN_LINES;

		const lines = content.split( '\n' );
		const contentLineCount = lines.length;

		const wrapper = document.querySelector(
			'.edit-site-global-styles-screen-css'
		);
		if ( wrapper ) {
			const wrapperHeight = wrapper.offsetHeight;
			const editorHeight = wrapperHeight - MARGIN;

			// Calculate the minimum number of lines that should be displayed
			const calcMinLineCount = Math.ceil( editorHeight / LINE_HEIGHT );
			requiredLines = Math.max( MIN_LINES, calcMinLineCount );

			// Set the max height of the editor allowing scrolling by `overflow-y: scroll`
			const editor = document.getElementById( editorId );
			if ( editor ) {
				editor.style.height = `${ editorHeight }px`;
			}
		}

		let result = content;
		for ( let i = contentLineCount; i < requiredLines; i++ ) {
			result += '\n';
		}

		return result;
	}
	const editorRef = useRef(null);
	useEffect( () => {
		( async () => {
			/**
			 * Lazy load CodeMirror by using Webpack's dynamic import.
			 * This should be replaced with native dynamic import once it's supported.
			 * @see https://github.com/WordPress/gutenberg/pull/60155
			 */
			// const { EditorView: CmEditorView, basicSetup } = await import( 'codemirror' );
			// const { indentWithTab } = await import( '@codemirror/commands' );
			// const { keymap } = await import( '@codemirror/view' );
			// const { css } = await import( '@codemirror/lang-css' );

			if ( editorRef.current ) {
				new CmEditorView( {
					doc: ensureMinLines( customCSS ),
					extensions: [
						basicSetup,
						css(),
						keymap.of( [ indentWithTab ] ),
						CmEditorView.updateListener.of( ( editor ) => {
							if ( editor.docChanged ) {
								onChange( editor.state.doc.toString() );
							}
						} ),
						CmEditorView.focusChangeEffect.of(
							( editorState, focusing ) => {
								if ( ! focusing ) {
									onBlur( editorState.doc.toString() );
								}
								return null;
							}
						),
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
		>
			{ __(
				`This editor allows you to input Additional CSS and customize the site's appearance with your own styles. Press Escape then Tab to move focus out of the editor.`
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