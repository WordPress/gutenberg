/**
 * WordPress dependencies
 */
import { MenuGroup, DropdownMenu, MenuItem } from '@wordpress/components';
import { check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

export default function PreviewMenu() {
	const deviceType = useSelect(
		( select ) =>
			select( editSiteStore ).__experimentalGetPreviewDeviceType(),
		[]
	);
	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
	} = useDispatch( editSiteStore );

	const isMobile = useViewportMatch( 'small', '<' );
	if ( isMobile ) {
		return null;
	}

	const popoverProps = {
		position: 'bottom left',
	};

	return (
		<DropdownMenu
			popoverProps={ popoverProps }
			toggleProps={ {
				isTertiary: true,
				/* translators: button label text should, if possible, be under 16 characters. */
				children: __( 'Preview' ),
			} }
			icon={ null }
		>
			{ () => (
				<>
					<MenuGroup>
						<MenuItem
							onClick={ () => setPreviewDeviceType( 'Desktop' ) }
							icon={ deviceType === 'Desktop' && check }
						>
							{ __( 'Desktop' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => setPreviewDeviceType( 'Tablet' ) }
							icon={ deviceType === 'Tablet' && check }
						>
							{ __( 'Tablet' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => setPreviewDeviceType( 'Mobile' ) }
							icon={ deviceType === 'Mobile' && check }
						>
							{ __( 'Mobile' ) }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
