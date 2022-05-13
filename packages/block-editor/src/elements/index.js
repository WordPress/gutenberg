/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from '../store';

export const ELEMENT_BUTTON_CLASS_NAME = 'wp-element-button';

export function useElementButtonClassName() {
	return useSelect( ( select ) => {
		return select( store ).getSettings().elementButtonClassName;
	} );
}

// This should also come from settings.
useElementButtonClassName.save = 'wp-element-button';
