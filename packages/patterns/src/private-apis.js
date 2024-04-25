/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import OverridesPanel from './components/overrides-panel';
import {
	default as CreatePatternModal,
	CreatePatternModalContents,
} from './components/create-pattern-modal';
import {
	default as DuplicatePatternModal,
	useDuplicatePatternProps,
} from './components/duplicate-pattern-modal';
import { isOverridableBlock } from './api';
import RenamePatternModal from './components/rename-pattern-modal';
import PatternsMenuItems from './components';
import RenamePatternCategoryModal from './components/rename-pattern-category-modal';
import PatternOverridesControls from './components/pattern-overrides-controls';
import ResetOverridesControl from './components/reset-overrides-control';
import { useAddPatternCategory } from './private-hooks';
import {
	PATTERN_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_USER_CATEGORY,
	EXCLUDED_PATTERN_SOURCES,
	PATTERN_SYNC_TYPES,
	PARTIAL_SYNCING_SUPPORTED_BLOCKS,
} from './constants';

export const privateApis = {};
lock( privateApis, {
	OverridesPanel,
	CreatePatternModal,
	CreatePatternModalContents,
	DuplicatePatternModal,
	isOverridableBlock,
	useDuplicatePatternProps,
	RenamePatternModal,
	PatternsMenuItems,
	RenamePatternCategoryModal,
	PatternOverridesControls,
	ResetOverridesControl,
	useAddPatternCategory,
	PATTERN_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_USER_CATEGORY,
	EXCLUDED_PATTERN_SOURCES,
	PATTERN_SYNC_TYPES,
	PARTIAL_SYNCING_SUPPORTED_BLOCKS,
} );
