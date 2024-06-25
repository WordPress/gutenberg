/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	VisuallyHidden,
	Icon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check, desktop, mobile, tablet, external } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostPreviewButton from '../post-preview-button';

export default function PreviewDropdown( { forceIsAutosaveable, disabled } ) {
	const { deviceType, homeUrl, isTemplate, isViewable, showIconLabels } =
		useSelect( ( select ) => {
			const { getDeviceType, getCurrentPostType } = select( editorStore );
			const { getUnstableBase, getPostType } = select( coreStore );
			const { get } = select( preferencesStore );
			const _currentPostType = getCurrentPostType();
			return {
				deviceType: getDeviceType(),
				homeUrl: getUnstableBase()?.home,
				isTemplate: _currentPostType === 'wp_template',
				isViewable: getPostType( _currentPostType )?.viewable ?? false,
				showIconLabels: get( 'core', 'showIconLabels' ),
			};
		}, [] );
	const { setDeviceType } = useDispatch( editorStore );
	const isMobile = useViewportMatch( 'medium', '<' );
	if ( isMobile ) {
		return null;
	}

	const popoverProps = {
		placement: 'bottom-end',
	};
	const toggleProps = {
		className: 'editor-preview-dropdown__toggle',
		size: 'compact',
		showTooltip: ! showIconLabels,
		disabled,
		__experimentalIsFocusable: disabled,
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
			className="editor-preview-dropdown"
			popoverProps={ popoverProps }
			toggleProps={ toggleProps }
			menuProps={ menuProps }
			icon={ deviceIcons[ deviceType.toLowerCase() ] }
			label={ __( 'View' ) }
			disableOpenOnArrowDown={ disabled }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItem
							onClick={ () => setDeviceType( 'Desktop' ) }
							icon={ deviceType === 'Desktop' && check }
						>
							{ __( 'Desktop' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => setDeviceType( 'Tablet' ) }
							icon={ deviceType === 'Tablet' && check }
						>
							{ __( 'Tablet' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => setDeviceType( 'Mobile' ) }
							icon={ deviceType === 'Mobile' && check }
						>
							{ __( 'Mobile' ) }
						</MenuItem>
					</MenuGroup>
					{ isTemplate && (
						<MenuGroup>
							<MenuItem
								href={ homeUrl }
								target="_blank"
								icon={ external }
								onClick={ onClose }
							>
								{ __( 'View site' ) }
								<VisuallyHidden as="span">
									{
										/* translators: accessibility text */
										__( '(opens in a new tab)' )
									}
								</VisuallyHidden>
							</MenuItem>
						</MenuGroup>
					) }
					{ isViewable && (
						<MenuGroup>
							<PostPreviewButton
								className="editor-preview-dropdown__button-external"
								role="menuitem"
								forceIsAutosaveable={ forceIsAutosaveable }
								textContent={
									<>
										{ __( 'Preview in new tab' ) }
										<Icon icon={ external } />
									</>
								}
								onPreview={ onClose }
							/>
						</MenuGroup>
					) }
				</>
			) }
		</DropdownMenu>
	);
}
