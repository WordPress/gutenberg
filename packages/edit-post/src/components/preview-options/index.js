/**
 * WordPress dependencies
 */
import {
	Button,
	Dropdown,
	Icon,
	MenuGroup,
	MenuItem,
	Polygon,
	SVG,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PostPreviewButton } from '@wordpress/editor';
import { __, _x } from '@wordpress/i18n';
import { external } from '@wordpress/icons';

const downArrow = (
	<SVG
		width="18"
		height="18"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 18 18"
	>
		<Polygon points="9,13.5 14.7,7.9 13.2,6.5 9,10.7 4.8,6.5 3.3,7.9 " />
	</SVG>
);

export default function PreviewOptions( {
	forceIsAutosaveable,
	forcePreviewLink,
} ) {
	const { setPreviewDeviceType } = useDispatch( 'core/block-editor' );

	const deviceType = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getPreviewDeviceType();
	}, [] );

	const translateDropdownButtonText = () => {
		switch ( deviceType ) {
			case 'Tablet':
				return __( 'Tablet' );
			case 'Mobile':
				return __( 'Mobile' );
			default:
				return __( 'Desktop' );
		}
	};

	const isSaveable = useSelect( ( select ) => {
		return select( 'core/editor' ).isEditedPostSaveable();
	}, [] );

	return (
		<Dropdown
			className="editor-post-preview__dropdown"
			contentClassName="editor-post-preview__dropdown-content"
			popoverProps={ { role: 'menu' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					onClick={ onToggle }
					className="editor-post-preview__button-toggle"
					aria-expanded={ isOpen }
					disabled={ ! isSaveable }
				>
					{ translateDropdownButtonText() }
					<div className="editor-post-preview__button-separator">
						{ downArrow }
					</div>
				</Button>
			) }
			renderContent={ () => (
				<>
					<MenuGroup label={ _x( 'View', 'noun' ) }>
						<MenuItem
							className="editor-post-preview__button-resize"
							onClick={ () => setPreviewDeviceType( 'Desktop' ) }
							icon={ deviceType === 'Desktop' && 'yes' }
						>
							{ __( 'Desktop' ) }
						</MenuItem>
						<MenuItem
							className="editor-post-preview__button-resize"
							onClick={ () => setPreviewDeviceType( 'Tablet' ) }
							icon={ deviceType === 'Tablet' && 'yes' }
						>
							{ __( 'Tablet' ) }
						</MenuItem>
						<MenuItem
							className="editor-post-preview__button-resize"
							onClick={ () => setPreviewDeviceType( 'Mobile' ) }
							icon={ deviceType === 'Mobile' && 'yes' }
						>
							{ __( 'Mobile' ) }
						</MenuItem>
					</MenuGroup>
					<MenuGroup>
						<div className="editor-post-preview__grouping-external">
							<PostPreviewButton
								className={
									'editor-post-preview__button-external'
								}
								forceIsAutosaveable={ forceIsAutosaveable }
								forcePreviewLink={ forcePreviewLink }
								textContent={ __( 'Preview externally' ) }
							/>
							<Icon
								icon={ external }
								className="editor-post-preview__icon-external"
							/>
						</div>
					</MenuGroup>
				</>
			) }
		/>
	);
}
