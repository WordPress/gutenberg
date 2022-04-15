/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __, _x } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { displayShortcut } from '@wordpress/keycodes';
import { external, update } from '@wordpress/icons';
import { MenuGroup, MenuItem, VisuallyHidden } from '@wordpress/components';
import { ActionItem, MoreMenuDropdown } from '@wordpress/interface';
import { PreferenceToggleMenuItem } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import { __experimentalUseEntityRecords as useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import KeyboardShortcutHelpModal from '../../keyboard-shortcut-help-modal';
import EditSitePreferencesModal from '../../preferences-modal';
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import SiteExport from './site-export';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';
import CopyContentMenuItem from './copy-content-menu-item';
import ModeSwitcher from '../mode-switcher';
import { store as editSiteStore } from '../../../store';

export default function MoreMenu() {
	const [ isModalActive, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	const [ isPreferencesModalActive, togglePreferencesModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	const { themeDevMode } = useSelect(
		( select ) => ( {
			themeDevMode: select( editSiteStore ).getSettings().themeDevMode,
		} ),
		[]
	);

	useShortcut( 'core/edit-site/keyboard-shortcuts', toggleModal );
	const { createErrorNotice, createInfoNotice } = useDispatch( noticesStore );

	const {
		records: templates,
		isResolving: isTemplateListLoading,
	} = useEntityRecords( 'postType', 'wp_template', {
		per_page: -1,
		source: 'custom',
	} );

	const {
		records: templateParts,
		isResolving: isTemplatePartListLoading,
	} = useEntityRecords( 'postType', 'wp_template_part', {
		per_page: -1,
	} );

	if ( ! templates || isTemplateListLoading ) {
		return null;
	}

	if ( ! templateParts || isTemplatePartListLoading ) {
		return null;
	}

	const customSourceFilter = ( tpl ) => tpl.source === 'custom';
	const unModifiedTheme =
		! filter( templates, customSourceFilter ).length &&
		! filter( templateParts, customSourceFilter ).length;

	const handleUpdateTheme = async () => {
		try {
			await apiFetch( {
				path: '/wp-block-editor/v1/export/update_theme',
			} );
			createInfoNotice( __( 'Customisations saved to theme' ), {
				speak: true,
				type: 'snackbar',
			} );
		} catch ( errorResponse ) {
			let error = {};
			try {
				error = await errorResponse.json();
			} catch ( e ) {}
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the site export.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	};

	return (
		<>
			<MoreMenuDropdown>
				{ ( { onClose } ) => (
					<>
						<MenuGroup label={ _x( 'View', 'noun' ) }>
							<PreferenceToggleMenuItem
								scope="core/edit-site"
								name="fixedToolbar"
								label={ __( 'Top toolbar' ) }
								info={ __(
									'Access all block and document tools in a single place'
								) }
								messageActivated={ __(
									'Top toolbar activated'
								) }
								messageDeactivated={ __(
									'Top toolbar deactivated'
								) }
							/>
							<PreferenceToggleMenuItem
								scope="core/edit-site"
								name="focusMode"
								label={ __( 'Spotlight mode' ) }
								info={ __( 'Focus on one block at a time' ) }
								messageActivated={ __(
									'Spotlight mode activated'
								) }
								messageDeactivated={ __(
									'Spotlight mode deactivated'
								) }
							/>
							<ModeSwitcher />
							<ActionItem.Slot
								name="core/edit-site/plugin-more-menu"
								label={ __( 'Plugins' ) }
								as={ MenuGroup }
								fillProps={ { onClick: onClose } }
							/>
						</MenuGroup>
						<MenuGroup label={ __( 'Tools' ) }>
							<SiteExport />
							{ themeDevMode && (
								<MenuItem
									icon={ update }
									onClick={ handleUpdateTheme }
									disabled={ unModifiedTheme }
									info={ __(
										'Update the current theme files with the customisations you made using the block editor'
									) }
								>
									{ __( 'Update theme' ) }
								</MenuItem>
							) }
							<MenuItem
								onClick={ toggleModal }
								shortcut={ displayShortcut.access( 'h' ) }
							>
								{ __( 'Keyboard shortcuts' ) }
							</MenuItem>
							<WelcomeGuideMenuItem />
							<CopyContentMenuItem />
							<MenuItem
								icon={ external }
								role="menuitem"
								href={ __(
									'https://wordpress.org/support/article/site-editor/'
								) }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __( 'Help' ) }
								<VisuallyHidden as="span">
									{
										/* translators: accessibility text */
										__( '(opens in a new tab)' )
									}
								</VisuallyHidden>
							</MenuItem>
							<ToolsMoreMenuGroup.Slot
								fillProps={ { onClose } }
							/>
						</MenuGroup>
						<MenuGroup>
							<MenuItem onClick={ togglePreferencesModal }>
								{ __( 'Preferences' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</MoreMenuDropdown>
			<KeyboardShortcutHelpModal
				isModalActive={ isModalActive }
				toggleModal={ toggleModal }
			/>
			<EditSitePreferencesModal
				isModalActive={ isPreferencesModalActive }
				toggleModal={ togglePreferencesModal }
			/>
		</>
	);
}
