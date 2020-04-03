/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { Card, CardBody, Spinner, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MenuEditor from '../menu-editor';

export default function MenusEditor( { blockEditorSettings } ) {
	const menus = useSelect( ( select ) => select( 'core' ).getMenus() );

	const [ menuId, setMenuId ] = useState( 0 );

	useEffect( () => {
		if ( menus?.length ) {
			setMenuId( menus[ 0 ].id );
		}
	}, [ menus ] );

	if ( ! menus ) {
		return <Spinner />;
	}

	return (
		<>
			<Card className="edit-navigation-menus-editor__menu-selection-card">
				<CardBody>
					<SelectControl
						className="edit-navigation-menus-editor__menu-select-control"
						label={ __( 'Select navigation to edit:' ) }
						options={ menus.map( ( menu ) => ( {
							value: menu.id,
							label: menu.name,
						} ) ) }
						onChange={ ( selectedMenuId ) =>
							setMenuId( selectedMenuId )
						}
					/>
				</CardBody>
			</Card>
			{ !! menuId && (
				<MenuEditor
					menuId={ menuId }
					blockEditorSettings={ blockEditorSettings }
					onDelete={ () => setMenuId( 0 ) }
				/>
			) }
		</>
	);
}
