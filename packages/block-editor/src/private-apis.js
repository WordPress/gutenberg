/**
 * Internal dependencies
 */
import * as globalStyles from './components/global-styles';
import { ExperimentalBlockEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import { horKey } from './store/reducer';
import { getRichTextValues } from './components/rich-text';
import ResizableBoxPopover from './components/resizable-box-popover';
import { ComposedPrivateInserter as PrivateInserter } from './components/inserter';
import { PrivateListView } from './components/list-view';
import BlockInfo from './components/block-info-slot-fill';
import { useShouldContextualToolbarShow } from './utils/use-should-contextual-toolbar-show';
import { cleanEmptyObject } from './hooks/utils';
import { useBlockEditingMode } from './components/block-editing-mode';

/**
 * Private @wordpress/block-editor APIs.
 */
export const privateApis = {};
lock( privateApis, {
	...globalStyles,
	ExperimentalBlockEditorProvider,
	horKey,
	getRichTextValues,
	PrivateInserter,
	PrivateListView,
	ResizableBoxPopover,
	BlockInfo,
	useShouldContextualToolbarShow,
	cleanEmptyObject,
	useBlockEditingMode,
} );
