import type { ComponentProps, JSXElementConstructor } from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import type * as BlockEditor from '..';

/*
 * Type assertions: `npm run typecheck` fails when one of them fails, while the
 * test runner only runs them as no-ops.
 */

/**
 * The public props a component takes: without `key`, `ref` and the private props
 * keyed by a symbol. Distributes over union props, which `Omit` would collapse to
 * their common keys.
 */
type PropsOf<
	// The constraint of `ComponentProps`.
	Component extends JSXElementConstructor< any >,
> =
	ComponentProps< Component > extends infer Props
		? Props extends unknown
			? Omit< Props, 'key' | 'ref' | symbol >
			: never
		: never;

describe( 'Public types', () => {
	it( 'exports the props of each component, without the ref', () => {
		expectTypeOf< BlockEditor.AlignmentControlProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.AlignmentControl >
		>();
		expectTypeOf< BlockEditor.BlockAlignmentControlProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockAlignmentControl >
		>();
		expectTypeOf< BlockEditor.BlockBindingsAttributeControlProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockBindingsAttributeControl >
		>();
		expectTypeOf< BlockEditor.BlockBindingsSourceFieldsListProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockBindingsSourceFieldsList >
		>();
		expectTypeOf< BlockEditor.BlockBreadcrumbProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockBreadcrumb >
		>();
		expectTypeOf< BlockEditor.BlockCanvasProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockCanvas >
		>();
		expectTypeOf< BlockEditor.BlockContextProviderProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockContextProvider >
		>();
		expectTypeOf< BlockEditor.BlockControlsProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockControls >
		>();
		expectTypeOf< BlockEditor.BlockEditProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockEdit >
		>();
		expectTypeOf< BlockEditor.BlockEditorProviderProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockEditorProvider >
		>();
		expectTypeOf< BlockEditor.BlockIconProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockIcon >
		>();
		expectTypeOf< BlockEditor.BlockListProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockList >
		>();
		expectTypeOf< BlockEditor.BlockMoverProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockMover >
		>();
		expectTypeOf< BlockEditor.BlockPopoverProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockPopover >
		>();
		expectTypeOf< BlockEditor.BlockPreviewProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockPreview >
		>();
		expectTypeOf< BlockEditor.BlockSettingsMenuProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockSettingsMenu >
		>();
		expectTypeOf< BlockEditor.BlockSettingsMenuControlsProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockSettingsMenuControls >
		>();
		expectTypeOf< BlockEditor.BlockStylesProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockStyles >
		>();
		expectTypeOf< BlockEditor.BlockTitleProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockTitle >
		>();
		expectTypeOf< BlockEditor.BlockToolbarProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockToolbar >
		>();
		expectTypeOf< BlockEditor.BlockToolsProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockTools >
		>();
		expectTypeOf< BlockEditor.BlockVerticalAlignmentControlProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.BlockVerticalAlignmentControl >
		>();
		expectTypeOf< BlockEditor.ButtonBlockAppenderProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.ButtonBlockAppender >
		>();
		expectTypeOf< BlockEditor.ColorPaletteControlProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.ColorPaletteControl >
		>();
		expectTypeOf< BlockEditor.ContrastCheckerProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.ContrastChecker >
		>();
		expectTypeOf< BlockEditor.DefaultBlockAppenderProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.DefaultBlockAppender >
		>();
		expectTypeOf< BlockEditor.DimensionControlProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.DimensionControl >
		>();
		expectTypeOf< BlockEditor.FontSizePickerProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.FontSizePicker >
		>();
		expectTypeOf< BlockEditor.HeadingLevelDropdownProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.HeadingLevelDropdown >
		>();
		expectTypeOf< BlockEditor.InnerBlocksProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.InnerBlocks >
		>();
		expectTypeOf< BlockEditor.InserterProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.Inserter >
		>();
		expectTypeOf< BlockEditor.InspectorControlsProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.InspectorControls >
		>();
		expectTypeOf< BlockEditor.JustifyContentControlProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.JustifyContentControl >
		>();
		expectTypeOf< BlockEditor.LineHeightControlProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.LineHeightControl >
		>();
		expectTypeOf< BlockEditor.LinkControlProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.LinkControl >
		>();
		expectTypeOf< BlockEditor.MediaPlaceholderProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.MediaPlaceholder >
		>();
		expectTypeOf< BlockEditor.MediaReplaceFlowProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.MediaReplaceFlow >
		>();
		expectTypeOf< BlockEditor.MediaUploadProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.MediaUpload >
		>();
		expectTypeOf< BlockEditor.MediaUploadCheckProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.MediaUploadCheck >
		>();
		expectTypeOf< BlockEditor.NavigableToolbarProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.NavigableToolbar >
		>();
		expectTypeOf< BlockEditor.ObserveTypingProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.ObserveTyping >
		>();
		expectTypeOf< BlockEditor.PanelColorSettingsProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.PanelColorSettings >
		>();
		expectTypeOf< BlockEditor.PlainTextProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.PlainText >
		>();
		expectTypeOf< BlockEditor.RecursionProviderProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.RecursionProvider >
		>();
		expectTypeOf< BlockEditor.RichTextProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.RichText >
		>();
		expectTypeOf< BlockEditor.RichTextShortcutProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.RichTextShortcut >
		>();
		expectTypeOf< BlockEditor.RichTextToolbarButtonProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.RichTextToolbarButton >
		>();
		expectTypeOf< BlockEditor.TypewriterProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.Typewriter >
		>();
		expectTypeOf< BlockEditor.URLInputProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.URLInput >
		>();
		expectTypeOf< BlockEditor.URLInputButtonProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.URLInputButton >
		>();
		expectTypeOf< BlockEditor.URLPopoverProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.URLPopover >
		>();
		expectTypeOf< BlockEditor.WarningProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.Warning >
		>();
		expectTypeOf< BlockEditor.WritingFlowProps >().branded.toEqualTypeOf<
			PropsOf< typeof BlockEditor.WritingFlow >
		>();
	} );

	it( 'exports the types of the hooks', () => {
		expectTypeOf< [ BlockEditor.UseBlockPropsProps ] >().toExtend<
			Parameters< typeof BlockEditor.useBlockProps >
		>();
		expectTypeOf<
			ReturnType< typeof BlockEditor.useBlockProps >
		>().branded.toEqualTypeOf< BlockEditor.UseBlockPropsResult >();
		expectTypeOf<
			[
				BlockEditor.UseInnerBlocksPropsProps,
				BlockEditor.InnerBlocksOptions,
			]
		>().toExtend< Parameters< typeof BlockEditor.useInnerBlocksProps > >();
		expectTypeOf<
			ReturnType< typeof BlockEditor.useInnerBlocksProps >
		>().branded.toEqualTypeOf< BlockEditor.UseInnerBlocksPropsResult >();
	} );

	it( 'keeps the internal props of the inner blocks private', () => {
		// @ts-expect-error The package doesn't export `InnerBlocksInternalProps`.
		expectTypeOf< BlockEditor.InnerBlocksInternalProps >().toBeObject();
	} );
} );
