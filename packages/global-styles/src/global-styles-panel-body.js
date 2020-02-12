/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
/**
 * Internal dependencies
 */
import { isEditSite } from './utils';

export function GlobalStylesPanelBody( props ) {
	if ( ! isEditSite() ) return null;

	return <PanelBody { ...props } />;
}
