/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check, desktop, mobile, tablet } from '@wordpress/icons';

export default function PreviewOptions( {
	children,
	viewLabel,
	className,
	isEnabled = true,
	deviceType,
	setDeviceType,
	label,
} ) {
	const isMobile = useViewportMatch( 'small', '<' );
	if ( isMobile ) return null;

	const popoverProps = {
		className: classnames(
			className,
			'block-editor-post-preview__dropdown-content'
		),
		placement: 'bottom-end',
	};
	const toggleProps = {
		className: 'block-editor-post-preview__button-toggle',
		disabled: ! isEnabled,
		children: viewLabel,
	};
	const menuProps = {
		'aria-label': __( 'View options' ),
	};

	const deviceIcons = {
		mobile,
		tablet,
		desktop,
	};

	return (
		<DropdownMenu
			className="block-editor-post-preview__dropdown"
			popoverProps={ popoverProps }
			toggleProps={ toggleProps }
			menuProps={ menuProps }
			icon={ deviceIcons[ deviceType.toLowerCase() ] }
			label={ label || __( 'Preview' ) }
		>
			{ () => (
				<>
					<MenuGroup>
						<MenuItem
							className="block-editor-post-preview__button-resize"
							onClick={ () => setDeviceType( 'Desktop' ) }
							icon={ deviceType === 'Desktop' && check }
						>
							{ __( 'Desktop' ) }
						</MenuItem>
						<MenuItem
							className="block-editor-post-preview__button-resize"
							onClick={ () => setDeviceType( 'Tablet' ) }
							icon={ deviceType === 'Tablet' && check }
						>
							{ __( 'Tablet' ) }
						</MenuItem>
						<MenuItem
							className="block-editor-post-preview__button-resize"
							onClick={ () => setDeviceType( 'Mobile' ) }
							icon={ deviceType === 'Mobile' && check }
						>
							{ __( 'Mobile' ) }
						</MenuItem>
					</MenuGroup>
					{ children }
				</>
			) }
		</DropdownMenu>
	);
}
