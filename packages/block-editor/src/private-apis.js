/**
 * Internal dependencies
 */
import * as globalStyles from './components/global-styles';
import { ExperimentalBlockEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import { getRichTextValues } from './components/rich-text/get-rich-text-values';
import ResizableBoxPopover from './components/resizable-box-popover';
import { default as PrivateQuickInserter } from './components/inserter/quick-inserter';
import {
	extractWords,
	getNormalizedSearchTerms,
	normalizeString,
} from './components/inserter/search-items';
import { PrivateListView } from './components/list-view';
import { useHasBlockToolbar } from './components/block-toolbar/use-has-block-toolbar';
import { cleanEmptyObject } from './hooks/utils';
import BlockQuickNavigation from './components/block-quick-navigation';
import { LayoutStyle } from './components/block-list/layout';
import BlockManager from './components/block-manager';
import { BlockRemovalWarningModal } from './components/block-removal-warning-modal';
import {
	setBackgroundStyleDefaults,
	useLayoutClasses,
	useLayoutStyles,
	__unstableBlockStyleVariationOverridesWithConfig,
	useZoomOut,
} from './hooks';
import DimensionsTool from './components/dimensions-tool';
import ResolutionTool from './components/resolution-tool';
import TextAlignmentControl from './components/text-alignment-control';
import { usesContextKey } from './components/rich-text/format-edit';
import { ExperimentalBlockCanvas } from './components/block-canvas';
import { getDuotoneFilter } from './components/duotone/utils';
import { useFlashEditableBlocks } from './components/use-flash-editable-blocks';
import {
	selectBlockPatternsKey,
	reusableBlocksSelectKey,
	globalStylesDataKey,
	globalStylesLinksDataKey,
	sectionRootClientIdKey,
	mediaEditKey,
	getMediaSelectKey,
	essentialFormatKey,
	isIsolatedEditorKey,
} from './store/private-keys';
import { requiresWrapperOnCopy } from './components/writing-flow/utils';
import { PrivateRichText } from './components/rich-text/';
import { PrivateBlockPopover } from './components/block-popover';
import { PrivateInserterLibrary } from './components/inserter/library';
import { PrivatePublishDateTimePicker } from './components/publish-date-time-picker';
import useSpacingSizes from './components/spacing-sizes-control/hooks/use-spacing-sizes';
import useBlockDisplayTitle from './components/block-title/use-block-display-title';
import TabbedSidebar from './components/tabbed-sidebar';
import CommentIconSlotFill from './components/collab/block-comment-icon-slot';
import CommentIconToolbarSlotFill from './components/collab/block-comment-icon-toolbar-slot';
import HTMLElementControl from './components/html-element-control';
import {
	useBlockElementRef,
	useBlockElement,
} from './components/block-list/use-block-props/use-block-refs';
import { LinkPicker } from './components/link-picker';
import useRemoteUrlData from './components/link-control/use-rich-url-data';

/**
 * Private @wordpress/block-editor APIs.
 */
export const privateApis = {};
lock( privateApis, {
	...globalStyles,
	ExperimentalBlockCanvas,
	ExperimentalBlockEditorProvider,
	getDuotoneFilter,
	getRichTextValues,
	PrivateQuickInserter,
	extractWords,
	getNormalizedSearchTerms,
	normalizeString,
	PrivateListView,
	ResizableBoxPopover,
	useHasBlockToolbar,
	cleanEmptyObject,
	BlockQuickNavigation,
	LayoutStyle,
	BlockManager,
	BlockRemovalWarningModal,
	useLayoutClasses,
	useLayoutStyles,
	DimensionsTool,
	ResolutionTool,
	TabbedSidebar,
	TextAlignmentControl,
	usesContextKey,
	useFlashEditableBlocks,
	HTMLElementControl,
	useZoomOut,
	globalStylesDataKey,
	globalStylesLinksDataKey,
	selectBlockPatternsKey,
	requiresWrapperOnCopy,
	PrivateRichText,
	PrivateInserterLibrary,
	reusableBlocksSelectKey,
	PrivateBlockPopover,
	PrivatePublishDateTimePicker,
	useSpacingSizes,
	useBlockDisplayTitle,
	__unstableBlockStyleVariationOverridesWithConfig,
	setBackgroundStyleDefaults,
	sectionRootClientIdKey,
	CommentIconSlotFill,
	CommentIconToolbarSlotFill,
	mediaEditKey,
	getMediaSelectKey,
	essentialFormatKey,
	isIsolatedEditorKey,
	useBlockElement,
	useBlockElementRef,
	LinkPicker,
	useRemoteUrlData,
} );
