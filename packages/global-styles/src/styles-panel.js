/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { isEditSite } from './utils';

export function StylesPanel( props ) {
	if ( ! isEditSite() ) return null;

	return <PanelBody { ...props } />;
}
