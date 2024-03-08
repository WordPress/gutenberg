/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import {
	default as CreatePatternModal,
	CreatePatternModalContents,
} from './components/create-pattern-modal';
import {
	default as DuplicatePatternModal,
	useDuplicatePatternProps,
} from './components/duplicate-pattern-modal';
import RenamePatternModal from './components/rename-pattern-modal';
import PatternsMenuItems from './components';
import RenamePatternCategoryModal from './components/rename-pattern-category-modal';
import useSetPatternBindings from './components/use-set-pattern-bindings';
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
	CreatePatternModal,
	CreatePatternModalContents,
	DuplicatePatternModal,
	useDuplicatePatternProps,
	RenamePatternModal,
	PatternsMenuItems,
	RenamePatternCategoryModal,
	useSetPatternBindings,
	ResetOverridesControl,
	useAddPatternCategory,
	PATTERN_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_USER_CATEGORY,
	EXCLUDED_PATTERN_SOURCES,
	PATTERN_SYNC_TYPES,
	PARTIAL_SYNCING_SUPPORTED_BLOCKS,
} );
