/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from '../store';
import type { WidgetType } from '../types';

export function useWidgetTypes(): WidgetType[] {
	return useSelect( ( select ) => select( store ).getWidgetTypes(), [] );
}
