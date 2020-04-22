/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	Dropdown,
	MenuGroup,
	MenuItem,
	Path,
	SVG,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';

const downArrow = (
	<SVG
		width="24"
		height="24"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
	>
		<Path d="M12.3 16.1l-5.8-5.6 1-1 4.7 4.4 4.3-4.4 1 1z" />
	</SVG>
);

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
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					onClick={ onToggle }
					className="block-editor-post-preview__button-toggle"
					aria-expanded={ isOpen }
					disabled={ ! isEnabled }
				>
					{ __( 'Preview' ) }
					{ downArrow }
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
