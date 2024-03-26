/**
 * WordPress dependencies
 */
import { Notice, __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useEffect, useRef, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as transformStyles } from '../../utils/transform-styles';

export default function AdvancedPanel( {
	value,
	onChange,
	inheritedValue = value,
} ) {
	// Custom CSS
	const [ cssError, setCSSError ] = useState( null );
	const customCSS = inheritedValue?.css;
	function handleOnChange( newValue ) {
		onChange( {
			...value,
			css: newValue,
		} );
		if ( cssError ) {
			const [ transformed ] = transformStyles(
				[ { css: newValue } ],
				'.editor-styles-wrapper'
			);
			if ( transformed ) {
				setCSSError( null );
			}
		}
	}
	function handleOnBlur( newValue ) {
		if ( ! newValue ) {
			setCSSError( null );
			return;
		}
		const [ transformed ] = transformStyles(
			[ { css: newValue } ],
			'.editor-styles-wrapper'
		);
		setCSSError(
			transformed === null
				? __( 'There is an error with your CSS structure.' )
				: null
		);
	}

	const editorRef = useRef();
	/**
	 * Ensure the editor has at least min lines of code,
	 * as the editor will shrink to fit the content.
	 * @param {string} content The content to ensure min lines for.
	 * @return {string} The content with at least min lines.
	 */
	function ensureMinLines( content ) {
		const MIN_LINES = 10;
		const lines = content.split( '\n' );
		const lineCount = lines.length;
		let result = content;
		for ( let i = lineCount; i < MIN_LINES; i++ ) {
			result += '\n';
		}
		return result;
	}
	useEffect( () => {
		( async () => {
			/**
			 * Lazy load CodeMirror by using Webpack's dynamic import.
			 * This should be replaced with native dynamic import once it's supported.
			 * @see https://github.com/WordPress/gutenberg/pull/60155
			 */
			const { EditorView, basicSetup } = await import( 'codemirror' );
			const { css } = await import( '@codemirror/lang-css' );

			if ( editorRef.current ) {
				new EditorView( {
					doc: ensureMinLines( customCSS ),
					extensions: [
						basicSetup,
						css(),
						EditorView.updateListener.of( ( editor ) => {
							if ( editor.docChanged ) {
								handleOnChange( editor.state.doc.toString() );
							}
						} ),
						EditorView.focusChangeEffect.of(
							( editorState, focusing ) => {
								if ( ! focusing ) {
									handleOnBlur( editorState.doc.toString() );
								}
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

	const cssEditorId = useId();
	return (
		<VStack spacing={ 3 }>
			{ cssError && (
				<Notice status="error" onRemove={ () => setCSSError( null ) }>
					{ cssError }
				</Notice>
			) }
			<label
				htmlFor={ cssEditorId }
				className="block-editor-global-styles-advanced-panel__custom-css-label"
			>
				{ __( 'Additional CSS' ) }
			</label>
			<div ref={ editorRef } id={ cssEditorId }></div>
		</VStack>
	);
}
