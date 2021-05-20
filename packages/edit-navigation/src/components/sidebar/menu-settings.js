/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { NameEditor } from '../name-editor';
import AutoAddPages from './auto-add-pages';

export default function MenuSettings( { menuId } ) {
	return (
		<PanelBody title={ __( 'Menu settings' ) }>
			<NameEditor />
			<AutoAddPages menuId={ menuId } />
		</PanelBody>
	);
}
