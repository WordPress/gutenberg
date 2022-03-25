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
import { check } from '@wordpress/icons';
import { PluginPreview } from '@wordpress/interface';

export default function PreviewOptions( {
	children,
	className,
	isEnabled = true,
	deviceType,
	setDeviceType,
} ) {
	const coreDeviceTypes = [
		{ type: 'Desktop', label: __( 'Desktop' ) },
		{ type: 'Tablet', label: __( 'Tablet' ) },
		{ type: 'Mobile', label: __( 'Mobile' ) },
	];

	const isMobile = useViewportMatch( 'small', '<' );
	if ( isMobile ) return null;

	const popoverProps = {
		className: classnames(
			className,
			'block-editor-post-preview__dropdown-content'
		),
		position: 'bottom left',
	};
	const toggleProps = {
		variant: 'tertiary',
		className: 'block-editor-post-preview__button-toggle',
		disabled: ! isEnabled,
		/* translators: button label text should, if possible, be under 16 characters. */
		children: __( 'Preview' ),
	};
	return (
		<DropdownMenu
			className="block-editor-post-preview__dropdown"
			popoverProps={ popoverProps }
			toggleProps={ toggleProps }
			icon={ null }
		>
			{ () => (
				<>
					<MenuGroup>
						{ coreDeviceTypes.map( ( device ) => (
							<MenuItem
								key={ device.type }
								className="block-editor-post-preview__button-resize"
								onClick={ () => setDeviceType( device.type ) }
								icon={ deviceType === device.type && check }
							>
								{ device.label }
							</MenuItem>
						) ) }
					</MenuGroup>
					<PluginPreview.Slot
						coreDevices={ coreDeviceTypes }
						fillProps={ {
							deviceType,
							setDeviceType,
						} }
					/>
					{ children }
				</>
			) }
		</DropdownMenu>
	);
}
