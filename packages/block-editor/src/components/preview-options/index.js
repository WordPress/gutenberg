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
import { useSelect, useDispatch } from '@wordpress/data';
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

export default function PreviewOptions( { isSaveable = true } ) {
	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
	} = useDispatch( 'core/block-editor' );

	const deviceType = useSelect( ( select ) => {
		return select(
			'core/block-editor'
		).__experimentalGetPreviewDeviceType();
	}, [] );

	return (
		<Dropdown
			className="block-editor-post-preview__dropdown"
			contentClassName="block-editor-post-preview__dropdown-content"
			popoverProps={ { role: 'menu' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					onClick={ onToggle }
					className="block-editor-post-preview__button-toggle"
					aria-expanded={ isOpen }
					disabled={ ! isSaveable }
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
							onClick={ () => setPreviewDeviceType( 'Desktop' ) }
							icon={ deviceType === 'Desktop' && check }
						>
							{ __( 'Desktop' ) }
						</MenuItem>
						<MenuItem
							className="block-editor-post-preview__button-resize"
							onClick={ () => setPreviewDeviceType( 'Tablet' ) }
							icon={ deviceType === 'Tablet' && check }
						>
							{ __( 'Tablet' ) }
						</MenuItem>
						<MenuItem
							className="block-editor-post-preview__button-resize"
							onClick={ () => setPreviewDeviceType( 'Mobile' ) }
							icon={ deviceType === 'Mobile' && check }
						>
							{ __( 'Mobile' ) }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		/>
	);
}
