// Block Creation Components
/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';
import {
	Autocomplete as RootAutocomplete,
	AlignmentToolbar as RootAlignmentToolbar,
	BlockAlignmentToolbar as RootBlockAlignmentToolbar,
	BlockControls as RootBlockControls,
	BlockEdit as RootBlockEdit,
	BlockEditorKeyboardShortcuts as RootBlockEditorKeyboardShortcuts,
	BlockFormatControls as RootBlockFormatControls,
	BlockIcon as RootBlockIcon,
	BlockInspector as RootBlockInspector,
	BlockList as RootBlockList,
	BlockMover as RootBlockMover,
	BlockNavigationDropdown as RootBlockNavigationDropdown,
	BlockSelectionClearer as RootBlockSelectionClearer,
	BlockSettingsMenu as RootBlockSettingsMenu,
	BlockTitle as RootBlockTitle,
	BlockToolbar as RootBlockToolbar,
	ColorPalette as RootColorPalette,
	ContrastChecker as RootContrastChecker,
	CopyHandler as RootCopyHandler,
	createCustomColorsHOC as rootCreateCustomColorsHOC,
	DefaultBlockAppender as RootDefaultBlockAppender,
	FontSizePicker as RootFontSizePicker,
	getColorClassName as rootGetColorClassName,
	getColorObjectByAttributeValues as rootGetColorObjectByAttributeValues,
	getColorObjectByColorValue as rootGetColorObjectByColorValue,
	getFontSize as rootGetFontSize,
	getFontSizeClass as rootGetFontSizeClass,
	Inserter as RootInserter,
	InnerBlocks as RootInnerBlocks,
	InspectorAdvancedControls as RootInspectorAdvancedControls,
	InspectorControls as RootInspectorControls,
	PanelColorSettings as RootPanelColorSettings,
	PlainText as RootPlainText,
	RichText as RootRichText,
	RichTextShortcut as RootRichTextShortcut,
	RichTextToolbarButton as RootRichTextToolbarButton,
	__unstableRichTextInputEvent as __unstableRootRichTextInputEvent,
	MediaPlaceholder as RootMediaPlaceholder,
	MediaUpload as RootMediaUpload,
	MediaUploadCheck as RootMediaUploadCheck,
	MultiBlocksSwitcher as RootMultiBlocksSwitcher,
	MultiSelectScrollIntoView as RootMultiSelectScrollIntoView,
	NavigableToolbar as RootNavigableToolbar,
	ObserveTyping as RootObserveTyping,
	PreserveScrollInReorder as RootPreserveScrollInReorder,
	SkipToSelectedBlock as RootSkipToSelectedBlock,
	URLInput as RootURLInput,
	URLInputButton as RootURLInputButton,
	URLPopover as RootURLPopover,
	Warning as RootWarning,
	WritingFlow as RootWritingFlow,
	withColorContext as rootWithColorContext,
	withColors as rootWithColors,
	withFontSizes as rootWithFontSizes,
} from '@wordpress/block-editor';

export { default as ServerSideRender } from '@wordpress/server-side-render';

function deprecateComponent( name, Wrapped, staticsToHoist = [] ) {
	const Component = forwardRef( ( props, ref ) => {
		deprecated( 'wp.editor.' + name, {
			alternative: 'wp.blockEditor.' + name,
		} );

		return <Wrapped ref={ ref } { ...props } />;
	} );

	staticsToHoist.forEach( ( staticName ) => {
		Component[ staticName ] = deprecateComponent(
			name + '.' + staticName,
			Wrapped[ staticName ]
		);
	} );

	return Component;
}

function deprecateFunction( name, func ) {
	return ( ...args ) => {
		deprecated( 'wp.editor.' + name, {
			alternative: 'wp.blockEditor.' + name,
		} );

		return func( ...args );
	};
}

const RichText = deprecateComponent( 'RichText', RootRichText, [ 'Content' ] );
RichText.isEmpty = deprecateFunction(
	'RichText.isEmpty',
	RootRichText.isEmpty
);

export { RichText };
export const Autocomplete = deprecateComponent(
	'Autocomplete',
	RootAutocomplete
);
export const AlignmentToolbar = deprecateComponent(
	'AlignmentToolbar',
	RootAlignmentToolbar
);
export const BlockAlignmentToolbar = deprecateComponent(
	'BlockAlignmentToolbar',
	RootBlockAlignmentToolbar
);
export const BlockControls = deprecateComponent(
	'BlockControls',
	RootBlockControls,
	[ 'Slot' ]
);
export const BlockEdit = deprecateComponent( 'BlockEdit', RootBlockEdit );
export const BlockEditorKeyboardShortcuts = deprecateComponent(
	'BlockEditorKeyboardShortcuts',
	RootBlockEditorKeyboardShortcuts
);
export const BlockFormatControls = deprecateComponent(
	'BlockFormatControls',
	RootBlockFormatControls,
	[ 'Slot' ]
);
export const BlockIcon = deprecateComponent( 'BlockIcon', RootBlockIcon );
export const BlockInspector = deprecateComponent(
	'BlockInspector',
	RootBlockInspector
);
export const BlockList = deprecateComponent( 'BlockList', RootBlockList );
export const BlockMover = deprecateComponent( 'BlockMover', RootBlockMover );
export const BlockNavigationDropdown = deprecateComponent(
	'BlockNavigationDropdown',
	RootBlockNavigationDropdown
);
export const BlockSelectionClearer = deprecateComponent(
	'BlockSelectionClearer',
	RootBlockSelectionClearer
);
export const BlockSettingsMenu = deprecateComponent(
	'BlockSettingsMenu',
	RootBlockSettingsMenu
);
export const BlockTitle = deprecateComponent( 'BlockTitle', RootBlockTitle );
export const BlockToolbar = deprecateComponent(
	'BlockToolbar',
	RootBlockToolbar
);
export const ColorPalette = deprecateComponent(
	'ColorPalette',
	RootColorPalette
);
export const ContrastChecker = deprecateComponent(
	'ContrastChecker',
	RootContrastChecker
);
export const CopyHandler = deprecateComponent( 'CopyHandler', RootCopyHandler );
export const DefaultBlockAppender = deprecateComponent(
	'DefaultBlockAppender',
	RootDefaultBlockAppender
);
export const FontSizePicker = deprecateComponent(
	'FontSizePicker',
	RootFontSizePicker
);
export const Inserter = deprecateComponent( 'Inserter', RootInserter );
export const InnerBlocks = deprecateComponent( 'InnerBlocks', RootInnerBlocks, [
	'ButtonBlockAppender',
	'DefaultBlockAppender',
	'Content',
] );
export const InspectorAdvancedControls = deprecateComponent(
	'InspectorAdvancedControls',
	RootInspectorAdvancedControls,
	[ 'Slot' ]
);
export const InspectorControls = deprecateComponent(
	'InspectorControls',
	RootInspectorControls,
	[ 'Slot' ]
);
export const PanelColorSettings = deprecateComponent(
	'PanelColorSettings',
	RootPanelColorSettings
);
export const PlainText = deprecateComponent( 'PlainText', RootPlainText );
export const RichTextShortcut = deprecateComponent(
	'RichTextShortcut',
	RootRichTextShortcut
);
export const RichTextToolbarButton = deprecateComponent(
	'RichTextToolbarButton',
	RootRichTextToolbarButton
);
export const __unstableRichTextInputEvent = deprecateComponent(
	'__unstableRichTextInputEvent',
	__unstableRootRichTextInputEvent
);
export const MediaPlaceholder = deprecateComponent(
	'MediaPlaceholder',
	RootMediaPlaceholder
);
export const MediaUpload = deprecateComponent( 'MediaUpload', RootMediaUpload );
export const MediaUploadCheck = deprecateComponent(
	'MediaUploadCheck',
	RootMediaUploadCheck
);
export const MultiBlocksSwitcher = deprecateComponent(
	'MultiBlocksSwitcher',
	RootMultiBlocksSwitcher
);
export const MultiSelectScrollIntoView = deprecateComponent(
	'MultiSelectScrollIntoView',
	RootMultiSelectScrollIntoView
);
export const NavigableToolbar = deprecateComponent(
	'NavigableToolbar',
	RootNavigableToolbar
);
export const ObserveTyping = deprecateComponent(
	'ObserveTyping',
	RootObserveTyping
);
export const PreserveScrollInReorder = deprecateComponent(
	'PreserveScrollInReorder',
	RootPreserveScrollInReorder
);
export const SkipToSelectedBlock = deprecateComponent(
	'SkipToSelectedBlock',
	RootSkipToSelectedBlock
);
export const URLInput = deprecateComponent( 'URLInput', RootURLInput );
export const URLInputButton = deprecateComponent(
	'URLInputButton',
	RootURLInputButton
);
export const URLPopover = deprecateComponent( 'URLPopover', RootURLPopover );
export const Warning = deprecateComponent( 'Warning', RootWarning );
export const WritingFlow = deprecateComponent( 'WritingFlow', RootWritingFlow );

export const createCustomColorsHOC = deprecateFunction(
	'createCustomColorsHOC',
	rootCreateCustomColorsHOC
);
export const getColorClassName = deprecateFunction(
	'getColorClassName',
	rootGetColorClassName
);
export const getColorObjectByAttributeValues = deprecateFunction(
	'getColorObjectByAttributeValues',
	rootGetColorObjectByAttributeValues
);
export const getColorObjectByColorValue = deprecateFunction(
	'getColorObjectByColorValue',
	rootGetColorObjectByColorValue
);
export const getFontSize = deprecateFunction( 'getFontSize', rootGetFontSize );
export const getFontSizeClass = deprecateFunction(
	'getFontSizeClass',
	rootGetFontSizeClass
);
export const withColorContext = deprecateFunction(
	'withColorContext',
	rootWithColorContext
);
export const withColors = deprecateFunction( 'withColors', rootWithColors );
export const withFontSizes = deprecateFunction(
	'withFontSizes',
	rootWithFontSizes
);
