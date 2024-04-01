/**
 * WordPress dependencies
 */
import { Notice, __experimentalVStack as VStack, BaseControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as transformStyles } from '../../utils/transform-styles';
import EditorView from './editor-view';

const EDITOR_ID =
	'block-editor-global-styles-advanced-panel__custom-css-editor';

/**
 * Returns the value that should be set for the code editor height
 */
function getEditorHeight() {
	/**
	 * (height of all the elements in the sidebar except the editor) + (height of the header) + (height of the footer)
	 * Currently, it's desktop-optimized. 
	 */
	const MARGIN = 234 + 60 + 25;
	const editorHeight = window.innerHeight - MARGIN;
	return editorHeight;
}

/**
 * Ensure the editor has at least min lines of code, as the editor will shrink to fit the content.
 *
 * @param {string} content - The content to ensure min lines for.
 * @return {string} The content with at least min lines.
 */
function ensureMinLines( content ) {
	const MIN_LINES = 10;
	const LINE_HEIGHT = 18.2; // Height of one line in the editor
	// const MARGIN = 53.4;
	let requiredLines = MIN_LINES;

	const lines = content.split( '\n' );
	const contentLineCount = lines.length;

	const editorHeight = getEditorHeight();
	if ( editorHeight !== 0 ) {
		// Calculate the minimum number of lines that should be displayed
		const calcMinLineCount = Math.ceil( editorHeight / LINE_HEIGHT );
		requiredLines = Math.max( MIN_LINES, calcMinLineCount );
	}

	let result = content;
	for ( let i = contentLineCount; i < requiredLines; i++ ) {
		result += '\n';
	}

	return result;
}

/**
 * Ensure the editor has at most max height to allow scrolling by `overflow-y: scroll`.
 * It needs to run after the editor DOM is mounted.
 */
function ensureMaxHeight() {
	const editorHeight = getEditorHeight();
	if ( editorHeight !== 0 ) {
		const editor = document.getElementById( EDITOR_ID );
		if ( editor ) {
			editor.style.height = `${ editorHeight }px`;
		}
	}
}

export default function AdvancedPanel( {
	value,
	onChange,
	inheritedValue = value,
} ) {
	// Custom CSS
	const [ cssError, setCSSError ] = useState( null );
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

	return (
		<VStack spacing={ 3 }>
			{ cssError && (
				<Notice status="error" onRemove={ () => setCSSError( null ) }>
					{ cssError }
				</Notice>
			) }
			<BaseControl
			id={ EDITOR_ID }
				help={`${__(
					`This editor allows you to input Additional CSS and customize the site's appearance with your own styles.`
				)} ${__(
					`Press Escape then Tab to move focus out of the editor.`
				)}`
			}
				label={__( 'Additional CSS' )}
			>
				<EditorView
					editorId={EDITOR_ID}
					initialConfig={
						{
							callback: ensureMaxHeight,
							content: ensureMinLines( inheritedValue?.css ),
							onBlur: handleOnBlur,
							onChange: handleOnChange,
							mode: "css",
						}
					}
					/>
			</BaseControl>
		</VStack>
	);
}
