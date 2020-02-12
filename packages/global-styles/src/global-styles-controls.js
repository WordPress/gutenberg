/**
 * Internal dependencies
 */
import { Fill } from './slot';
import { isEditSite } from './utils';

export function GlobalStylesControls( { children } ) {
	if ( ! isEditSite() ) return null;

	return <Fill>{ children }</Fill>;
}
