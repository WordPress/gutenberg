/**
 * WordPress dependencies
 */
import { Notice, __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as transformStyles } from '../../utils/transform-styles';
import EditorView from './editor-view';

const EDITOR_ID =
	'block-editor-global-styles-advanced-panel__custom-css-editor';
const EDITOR_INSTRUCTIONS_ID = `${ EDITOR_ID }-instructions`;

/**
 * Returns the value that should be set for the code editor height
 */
function getEditorHeight() {
	const MARGIN = 53.4;
	const wrapper = document.querySelector(
		'.edit-site-global-styles-screen-css'
	);
	if ( wrapper ) {
		const wrapperHeight = wrapper.offsetHeight;
		const editorHeight = wrapperHeight - MARGIN;
		return editorHeight;
	}
	return 0;
}

/**
 * Ensure the editor has at least min lines of code, as the editor will shrink to fit the content.
 *
 * @param {string} content - The content to ensure min lines for.
 * @param {string} editorId - The ID of the editor.
 * @returns {string} The content with at least min lines.
 */
function ensureMinLines( content, editorId ) {
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

	const [ customCSS, setCustomCSS ] = useState( '' );
	useEffect( () => {
		if ( customCSS !== '' ) {
			return;
		}
		setCustomCSS( ensureMinLines( inheritedValue?.css, EDITOR_ID ) );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [inheritedValue?.css])

	return (
		<VStack spacing={ 3 }>
			{ cssError && (
				<Notice status="error" onRemove={ () => setCSSError( null ) }>
					{ cssError }
				</Notice>
			) }
			<label
				htmlFor={ EDITOR_ID }
				className="block-editor-global-styles-advanced-panel__custom-css-label"
			>
				{ __( 'Additional CSS' ) }
			</label>
			{
				customCSS !== '' &&
				<EditorView
					content={ customCSS }
					editorId={EDITOR_ID}
					editorInstructionsId={EDITOR_INSTRUCTIONS_ID}
					editorInstructionsText={__(
						`This editor allows you to input Additional CSS and customize the site's appearance with your own styles.`
						)}
					mode="css"
					onBlur={ handleOnBlur }
					onChange={ handleOnChange }
				/>
			}
		</VStack>
	);
}
