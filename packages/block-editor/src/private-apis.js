/**
 * Internal dependencies
 */
import * as globalStyles from './components/global-styles';
import { ExperimentalBlockEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import { getRichTextValues } from './components/rich-text/get-rich-text-values';
import ResizableBoxPopover from './components/resizable-box-popover';
import { ComposedPrivateInserter as PrivateInserter } from './components/inserter';
import { default as PrivateQuickInserter } from './components/inserter/quick-inserter';
import {
	extractWords,
	getNormalizedSearchTerms,
	normalizeString,
} from './components/inserter/search-items';
import { PrivateListView } from './components/list-view';
import BlockInfo from './components/block-info-slot-fill';
import { useHasBlockToolbar } from './components/block-toolbar/use-has-block-toolbar';
import { cleanEmptyObject } from './hooks/utils';
import BlockQuickNavigation from './components/block-quick-navigation';
import { LayoutStyle } from './components/block-list/layout';
import { BlockRemovalWarningModal } from './components/block-removal-warning-modal';
import {
	setBackgroundStyleDefaults,
	useLayoutClasses,
	useLayoutStyles,
	__unstableBlockStyleVariationOverridesWithConfig,
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
} from './store/private-keys';
import { requiresWrapperOnCopy } from './components/writing-flow/utils';
import { PrivateRichText } from './components/rich-text/';
import { PrivateBlockPopover } from './components/block-popover';
import { PrivateInserterLibrary } from './components/inserter/library';
import { PrivatePublishDateTimePicker } from './components/publish-date-time-picker';
import useSpacingSizes from './components/spacing-sizes-control/hooks/use-spacing-sizes';
import useBlockDisplayTitle from './components/block-title/use-block-display-title';
import TabbedSidebar from './components/tabbed-sidebar';

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
	PrivateInserter,
	PrivateQuickInserter,
	extractWords,
	getNormalizedSearchTerms,
	normalizeString,
	PrivateListView,
	ResizableBoxPopover,
	BlockInfo,
	useHasBlockToolbar,
	cleanEmptyObject,
	BlockQuickNavigation,
	LayoutStyle,
	BlockRemovalWarningModal,
	useLayoutClasses,
	useLayoutStyles,
	DimensionsTool,
	ResolutionTool,
	TabbedSidebar,
	TextAlignmentControl,
	usesContextKey,
	useFlashEditableBlocks,
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
} );
