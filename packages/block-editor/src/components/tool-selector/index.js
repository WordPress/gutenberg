/**
 * WordPress dependencies
 */
import {
	Dropdown,
	Button,
	MenuItemsChoice,
	SVG,
	Path,
	NavigableMenu,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';

const editIcon = <SVG xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><Path fill="none" d="M0 0h24v24H0V0z" /><Path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z" /></SVG>;
const selectIcon = <SVG xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><Path d="M6.5 1v21.5l6-6.5H21L6.5 1zm5.1 13l-3.1 3.4V5.9l7.8 8.1h-4.7z" /></SVG>;

function ToolSelector() {
	const isNavigationTool = useSelect( ( select ) => select( 'core/block-editor' ).isNavigationMode(), [] );
	const { setNavigationMode } = useDispatch( 'core/block-editor' );
	const isMediumViewport = useViewportMatch( 'medium' );
	if ( ! isMediumViewport ) {
		return null;
	}

	const onSwitchMode = ( mode ) => {
		setNavigationMode( mode === 'edit' ? false : true );
	};

	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					icon={ isNavigationTool ? selectIcon : editIcon }
					aria-expanded={ isOpen }
					onClick={ onToggle }
					label={ __( 'Tools' ) }
				/>
			) }
			renderContent={ () => (
				<>
					<NavigableMenu
						role="menu"
						aria-label={ __( 'Tools' ) }
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
								},
								{
									value: 'select',
									label: (
										<>
											{ selectIcon }
											{ __( 'Select' ) }
										</>
									),
								},
							] }
						/>
					</NavigableMenu>
					<div className="block-editor-tool-selector__help">
						{ __( 'Tools offer different interactions for block selection & editing. To select, press Escape, to go back to editing, press Enter.' ) }
					</div>
				</>
			) }
		/>
	);
}

export default ToolSelector;
