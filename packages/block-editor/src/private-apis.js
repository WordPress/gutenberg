/**
 * Internal dependencies
 */
import * as globalStyles from './components/global-styles';
import { ExperimentalBlockEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import OffCanvasEditor from './components/off-canvas-editor';
import LeafMoreMenu from './components/off-canvas-editor/leaf-more-menu';
import { ComposedPrivateInserter as PrivateInserter } from './components/inserter';
import { default as useConvertToGroupButtonProps } from './components/convert-to-group-buttons/use-convert-to-group-button-props';
import {
	hasStickyPositionSupport,
	useIsPositionDisabled,
} from './hooks/position';

/**
 * Private @wordpress/block-editor APIs.
 */
export const privateApis = {};
lock( privateApis, {
	...globalStyles,
	ExperimentalBlockEditorProvider,
	LeafMoreMenu,
	OffCanvasEditor,
	PrivateInserter,
	useConvertToGroupButtonProps,
	hasStickyPositionSupport,
	useIsPositionDisabled,
} );
