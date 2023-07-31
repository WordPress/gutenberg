/**
 * Internal dependencies
 */
import { default as CreatePatternModal } from './components/create-pattern-modal';
import { lock } from './lock-unlock';

/**
 * Private @wordpress/reusable-block APIs.
 */
export const privateApis = {};
lock( privateApis, {
	CreatePatternModal,
} );
