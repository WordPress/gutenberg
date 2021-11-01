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
	const coreDeviceTypes = [ 'Desktop', 'Tablet', 'Mobile' ];

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
								key={ device }
								className="block-editor-post-preview__button-resize"
								onClick={ () => setDeviceType( device ) }
								icon={ deviceType === device && check }
							>
								{ device }
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
