/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import CreatePatternModal from './components/create-pattern-modal';
import PatternsMenuItems from './components';

export const privateApis = {};
lock( privateApis, {
	CreatePatternModal,
	PatternsMenuItems,
} );
