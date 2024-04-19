/**
 * Internal dependencies
 */
export { store } from './store';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	CreatePatternModal: () => null,
	PatternsMenuItems: () => null,
	RenameBlockModalControl: () => null,
} );
