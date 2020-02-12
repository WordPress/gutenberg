/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Fill } from './slot';
import { isEditSite } from './utils';

export function StylesPanel( props ) {
	if ( ! isEditSite() ) return null;

	return (
		<Fill>
			<PanelBody { ...props } />
		</Fill>
	);
}
