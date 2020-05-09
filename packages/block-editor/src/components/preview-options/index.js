/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, check, chevronDown } from '@wordpress/icons';

export default function PreviewOptions( {
	children,
	className,
	isEnabled = true,
	deviceType,
	setDeviceType,
} ) {
	return (
		<Dropdown
			className="block-editor-post-preview__dropdown"
			contentClassName={ classnames(
				className,
				'block-editor-post-preview__dropdown-content'
			) }
			popoverProps={ { role: 'menu' } }
			position="bottom left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					onClick={ onToggle }
					className="block-editor-post-preview__button-toggle"
					aria-expanded={ isOpen }
					disabled={ ! isEnabled }
				>
					{ __( 'Preview' ) }
					<Icon icon={ chevronDown } />
				</Button>
			) }
			renderContent={ () => (
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
		/>
	);
}
