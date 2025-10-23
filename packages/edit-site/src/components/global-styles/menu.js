/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { moreVertical } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import { useGlobalStyles } from './hooks';

/**
 * Action menu with Reset, Welcome Guide, and Additional CSS
 */
export function GlobalStylesActionMenu() {
	const { user, setUser } = useGlobalStyles();

	// Check if there are user customizations that can be reset
	const canReset =
		!! user &&
		( Object.keys( user?.styles ?? {} ).length > 0 ||
			Object.keys( user?.settings ?? {} ).length > 0 );

	// Reset function to clear all user customizations
	const onReset = () => {
		setUser( { styles: {}, settings: {} } );
	};
	const { toggle } = useDispatch( preferencesStore );
	const { canEditCSS } = useSelect( ( select ) => {
		const { getEntityRecord, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore );

		const globalStylesId = __experimentalGetCurrentGlobalStylesId();
		const globalStyles = globalStylesId
			? getEntityRecord( 'root', 'globalStyles', globalStylesId )
			: undefined;

		return {
			canEditCSS: !! globalStyles?._links?.[ 'wp:action-edit-css' ],
		};
	}, [] );
	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const loadCustomCSS = () => {
		setEditorCanvasContainerView( 'global-styles-css' );
	};

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'More' ) }
			toggleProps={ { size: 'compact' } }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						{ canEditCSS && (
							<MenuItem onClick={ loadCustomCSS }>
								{ __( 'Additional CSS' ) }
							</MenuItem>
						) }
						<MenuItem
							onClick={ () => {
								toggle(
									'core/edit-site',
									'welcomeGuideStyles'
								);
								onClose();
							} }
						>
							{ __( 'Welcome Guide' ) }
						</MenuItem>
					</MenuGroup>
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								onReset();
								onClose();
							} }
							disabled={ ! canReset }
						>
							{ __( 'Reset styles' ) }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
