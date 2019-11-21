/**
 * WordPress dependencies
 */
import {
	Dropdown,
	IconButton,
	MenuItemsChoice,
	SVG,
	Path,
	NavigableMenu,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { ifViewportMatches } from '@wordpress/viewport';

const editIcon = <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><Path fill="none" d="M0 0h24v24H0V0z" /><Path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z" /></SVG>;
const selectIcon = <SVG xmlns="http://www.w3.org/2000/svg" fill="#000000" viewBox="0 0 24 24" width="24px" height="24px"><Path d="M 7 2 L 7 18.5 L 11.09375 14.605469 L 14.300781 22 L 16.5 21 L 13.195312 13.701172 L 13.199219 13.699219 L 19 13.199219 L 7 2 z M 9 6.6015625 L 14.347656 11.59375 L 13.029297 11.707031 L 12.708984 11.734375 L 12.412109 11.861328 L 10.3125 12.761719 L 9.9824219 12.904297 L 9.7226562 13.152344 L 9 13.837891 L 9 6.6015625 z" /></SVG>;

function NavigationToolSelector() {
	const isNavigationTool = useSelect( ( select ) => select( 'core/block-editor' ).isNavigationMode() );
	const { setNavigationMode } = useDispatch( 'core/block-editor' );
	const onSwitchMode = ( mode ) => {
		setNavigationMode( mode === 'edit' ? false : true );
	};

	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<IconButton
					icon={ isNavigationTool ? selectIcon : editIcon }
					aria-expanded={ isOpen }
					onClick={ onToggle }
					label={ __( 'Navigation Tool' ) }
				/>
			) }
			renderContent={ () => (
				<>
					<NavigableMenu
						role="menu"
						aria-label={ __( 'Navigation Tool' ) }
					>
						<MenuItemsChoice
							value={ isNavigationTool ? 'select' : 'edit' }
							onSelect={ onSwitchMode }
							choices={ [
								{
									value: 'edit',
									label: (
										<>
											{ editIcon }
											{ __( 'Edit' ) }
										</>
									),
									shortcut: isNavigationTool ? 'Enter' : undefined,
								},
								{
									value: 'select',
									label: (
										<>
											{ selectIcon }
											{ __( 'Select' ) }
										</>
									),
									shortcut: isNavigationTool ? undefined : 'Esc',
								},
							] }
						/>
					</NavigableMenu>
					<div className="block-editor-navigation-mode-selector__help">
						{ __( 'Tools offer different block interactions to optimize block selection & editing tasks' ) }
					</div>
				</>
			) }
		/>
	);
}

export default ifViewportMatches( 'medium' )( NavigationToolSelector );
