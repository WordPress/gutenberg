/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import CreatePatternModal from './components/create-pattern-modal';
import RenamePatternModal from './components/rename-pattern-modal';
import PatternsMenuItems from './components';
import {
	PATTERN_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_USER_CATEGORY,
	PATTERN_CORE_SOURCES,
	PATTERN_SYNC_TYPES,
} from './constants';

export const privateApis = {};
lock( privateApis, {
	CreatePatternModal,
	RenamePatternModal,
	PatternsMenuItems,
	PATTERN_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_USER_CATEGORY,
	PATTERN_CORE_SOURCES,
	PATTERN_SYNC_TYPES,
} );
