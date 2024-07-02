/**
 * Internal dependencies
 */
import './store';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	CreatePatternModal: () => null,
	PatternsMenuItems: () => null,
} );
