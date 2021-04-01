/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useMenuEntity } from '../../hooks';

export default function AutoAddPages( {
	menuId,
	autoAddPages,
	setAutoAddPages,
} ) {
	const menu = useSelect( ( select ) => select( 'core' ).getMenu( menuId ), [
		menuId,
	] );

	useEffect( () => {
		if ( autoAddPages === null && menu ) {
			setAutoAddPages( menu.auto_add );
		}
	}, [ autoAddPages, menu ] );

	const { editMenuEntityRecord, menuEntityData } = useMenuEntity( menuId );

	return (
		<ToggleControl
			label={ __( 'Add new pages' ) }
			help={ __(
				'Automatically add published top-level pages to this menu.'
			) }
			checked={ autoAddPages ?? false }
			onChange={ ( newAutoAddPages ) => {
				setAutoAddPages( newAutoAddPages );
				editMenuEntityRecord( ...menuEntityData, {
					auto_add: newAutoAddPages,
				} );
			} }
		/>
	);
}
