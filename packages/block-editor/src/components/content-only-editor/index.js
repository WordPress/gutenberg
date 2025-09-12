/**
 * WordPress dependencies
 */
/**
 * Internal dependencies
 */
import { ExperimentalBlockEditorProvider } from '../provider';
import { ExperimentalBlockCanvas } from '../block-canvas';

/**
 * ContentOnlyBlockEditor component that provides a sidebar block canvas
 * that syncs with the main canvas blocks in real-time.
 *
 * @param {Object} props        Component props.
 * @param {Array}  props.blocks Array of block objects to sync with.
 */
export default function ContentOnlyBlockEditor( { blocks = [] } ) {
	// Minimal editor settings for content-only editor
	const editorSettings = {
		// Enable block selection by disabling automatic selection clearing
		clearBlockSelection: false,

		// Disable UI elements that aren't needed for content-only editing
		hasFixedToolbar: false,
		hasReducedUI: true,
		hasBlockBreadcrumbs: false,
		hasBlockToolbar: false,
		hasSidebar: false,
		hasOutline: false,
		hasList: false,
		hasInserter: false,
		hasGlobalStyles: false,
		hasBlockSettings: false,
		hasInspector: false,
		hasTopToolbar: false,
		hasCommandPalette: false,
		hasKeyboardShortcuts: true,
		hasHelp: false,
		hasWelcomeGuide: false,
		hasBlockPatterns: false,
		hasReusableBlocks: false,
		hasBlockDirectory: false,
		hasBlockNavigation: false,
		hasBlockQuickNavigation: false,

		// Allow all block types for content editing
		allowedBlockTypes: true,

		// Disable focus mode to prevent contenteditable conflicts
		focusMode: false,

		// Additional settings to prevent editing conflicts
		keepCaretInsideBlock: false,
		isDistractionFree: true,
	};
	// TODO: This canvas is locked in canvas only mode. Is it possible to allow a different editing mode for this editor canvas?
	// TODO: Can we only register the content blocks we want? like core/paragraph, core/list, and core/list-item?
	// TODO: We can pass the blocks, but can we two-way sync them?
	// TODO: Allow some shortcuts such as redo, undo, copy, paste, bold, italic, strikethrough, and command+k for links
	return (
		<div style={ { border: '1px solid #ddd', padding: '10px' } }>
			<ExperimentalBlockEditorProvider
				value={ blocks }
				settings={ editorSettings }
				onInput={ () => {
					// onChange( blocks );
				} }
				onChange={ () => {
					// onChange( blocks );
				} }
			>
				<ExperimentalBlockCanvas />
			</ExperimentalBlockEditorProvider>
		</div>
	);
}
