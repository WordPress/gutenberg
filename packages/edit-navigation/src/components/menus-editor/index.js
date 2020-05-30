/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import {
	Button,
	Card,
	CardBody,
	Spinner,
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CreateMenuPanel from './create-menu-panel';
import MenuEditor from '../menu-editor';

export default function MenusEditor( { blockEditorSettings } ) {
	const { menus, hasLoadedMenus } = useSelect( ( select ) => {
		const { getMenus, hasFinishedResolution } = select( 'core' );
		const query = { per_page: -1 };
		return {
			menus: getMenus( query ),
			hasLoadedMenus: hasFinishedResolution( 'getMenus', [ query ] ),
		};
	}, [] );

	const [ hasCompletedFirstLoad, setHasCompletedFirstLoad ] = useState(
		false
	);

	const { deleteMenu } = useDispatch( 'core' );

	useEffect( () => {
		if ( ! hasCompletedFirstLoad && hasLoadedMenus ) {
			setHasCompletedFirstLoad( true );
		}
	}, [ hasLoadedMenus ] );

	const [ menuId, setMenuId ] = useState();
	const [ showCreateMenuPanel, setShowCreateMenuPanel ] = useState( false );

	useEffect( () => {
		if ( menus?.length ) {
			// Only set menuId if it's currently unset.
			if ( ! menuId ) {
				setMenuId( menus[ 0 ].id );
			}
		}
	}, [ menus, menuId ] );

	if ( ! hasCompletedFirstLoad ) {
		return <Spinner />;
	}

	const hasMenus = !! menus?.length;
	const isCreateMenuPanelVisible =
		hasCompletedFirstLoad && ( ! hasMenus || showCreateMenuPanel );

	return (
		<>
			<Card className="edit-navigation-menus-editor__menu-selection-card">
				<CardBody className="edit-navigation-menus-editor__menu-selection-card-body">
					{ hasCompletedFirstLoad && ! hasMenus && (
						<p className="edit-navigation-menus-editor__menu-selection-card-instructional-text">
							{ __( 'Create your first menu below.' ) }
						</p>
					) }
					{ hasMenus && (
						<>
							<SelectControl
								className="edit-navigation-menus-editor__menu-select-control"
								label={ __( 'Select navigation to edit:' ) }
								options={ menus?.map( ( menu ) => ( {
									value: menu.id,
									label: menu.name,
								} ) ) }
								onChange={ ( selectedMenuId ) =>
									setMenuId( selectedMenuId )
								}
								value={ menuId }
							/>
							<Button
								isLink
								onClick={ () => setShowCreateMenuPanel( true ) }
							>
								{ __( 'Create a new menu' ) }
							</Button>
						</>
					) }
				</CardBody>
			</Card>
			{ isCreateMenuPanelVisible && (
				<CreateMenuPanel
					menus={ menus }
					onCancel={
						// User can only cancel out of menu creation if there
						// are other menus to fall back to showing.
						hasMenus
							? () => setShowCreateMenuPanel( false )
							: undefined
					}
					onCreateMenu={ ( newMenuId ) => {
						setMenuId( newMenuId );
						setShowCreateMenuPanel( false );
					} }
				/>
			) }
			{ hasMenus && (
				<MenuEditor
					menuId={ menuId }
					blockEditorSettings={ blockEditorSettings }
					onDeleteMenu={ async () => {
						await deleteMenu( menuId, '' );
					} }
				/>
			) }
		</>
	);
}
