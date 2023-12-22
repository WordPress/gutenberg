/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import {
	code,
	drawerLeft,
	drawerRight,
	blockDefault,
	keyboard,
	desktop,
	listView,
	external,
	formatListBullets,
	image,
} from '@wordpress/icons';
import { useCommand } from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';
import { store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { KEYBOARD_SHORTCUT_HELP_MODAL_NAME } from '../../components/keyboard-shortcut-help-modal';
import { PREFERENCES_MODAL_NAME } from '../../components/preferences-modal';
import { store as editPostStore } from '../../store';

export default function useCommonCommands() {
	const {
		openGeneralSidebar,
		closeGeneralSidebar,
		switchEditorMode,
		toggleDistractionFree,
	} = useDispatch( editPostStore );
	const { openModal } = useDispatch( interfaceStore );
	const {
		editorMode,
		activeSidebar,
		isListViewOpen,
		isPublishSidebarEnabled,
		showBlockBreadcrumbs,
		isDistractionFree,
	} = useSelect( ( select ) => {
		const { getEditorMode, isFeatureActive } = select( editPostStore );
		const { isListViewOpened } = select( editorStore );
		return {
			activeSidebar: select( interfaceStore ).getActiveComplementaryArea(
				editPostStore.name
			),
			editorMode: getEditorMode(),
			isListViewOpen: isListViewOpened(),
			isPublishSidebarEnabled:
				select( editorStore ).isPublishSidebarEnabled(),
			showBlockBreadcrumbs: isFeatureActive( 'showBlockBreadcrumbs' ),
			isDistractionFree: select( preferencesStore ).get(
				editPostStore.name,
				'distractionFree'
			),
		};
	}, [] );
	const { toggle } = useDispatch( preferencesStore );
	const { createInfoNotice } = useDispatch( noticesStore );
	const { __unstableSaveForPreview, setIsListViewOpened, editPost } =
		useDispatch( editorStore );
	const { getCurrentPostId, getEditedPostAttribute } =
		useSelect( editorStore );

	/**
	 * Sets the featured image for the current post.
	 *
	 * @param {number} currentFeaturedImageId - The ID of the currently selected featured image.
	 * @return {void}
	 */
	const setFeaturedImage = ( currentFeaturedImageId ) => {
		const { wp } = window;
		const frame = wp.media( {
			title: __( 'Select Featured Image' ),
			button: {
				text: __( 'Use this image' ),
			},
			multiple: false,
		} );

		frame.on( 'open', () => {
			// Get the selection object.
			const selection = frame.state().get( 'selection' );

			// If there's a previously selected featured image, pre-select it in the media modal.
			if ( currentFeaturedImageId ) {
				const attachment = wp.media.attachment(
					currentFeaturedImageId
				);
				attachment.fetch();
				selection.add( attachment ? [ attachment ] : [] );
			}
		} );

		// When an image is selected, setting the featured image.
		frame.on( 'select', () => {
			const attachment = frame
				.state()
				.get( 'selection' )
				.first()
				.toJSON();

			// If the selected image is different from the current featured image, update it.
			if ( attachment.id !== currentFeaturedImageId ) {
				// Update the featured image ID of the current post.
				editPost( { featured_media: attachment.id } );
			}

			// Close the media modal.
			frame.close();
		} );

		// Open the media uploader.
		frame.open();
	};

	useCommand( {
		name: 'core/open-settings-sidebar',
		label: __( 'Toggle settings sidebar' ),
		icon: isRTL() ? drawerLeft : drawerRight,
		callback: ( { close } ) => {
			close();
			if ( activeSidebar === 'edit-post/document' ) {
				closeGeneralSidebar();
			} else {
				openGeneralSidebar( 'edit-post/document' );
			}
		},
	} );

	useCommand( {
		name: 'core/open-block-inspector',
		label: __( 'Toggle block inspector' ),
		icon: blockDefault,
		callback: ( { close } ) => {
			close();
			if ( activeSidebar === 'edit-post/block' ) {
				closeGeneralSidebar();
			} else {
				openGeneralSidebar( 'edit-post/block' );
			}
		},
	} );

	useCommand( {
		name: 'core/toggle-distraction-free',
		label: __( 'Toggle distraction free' ),
		callback: ( { close } ) => {
			toggleDistractionFree();
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-spotlight-mode',
		label: __( 'Toggle spotlight mode' ),
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'focusMode' );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-fullscreen-mode',
		label: __( 'Toggle fullscreen mode' ),
		icon: desktop,
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'fullscreenMode' );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-list-view',
		label: __( 'Toggle list view' ),
		icon: listView,
		callback: ( { close } ) => {
			setIsListViewOpened( ! isListViewOpen );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-top-toolbar',
		label: __( 'Toggle top toolbar' ),
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'fixedToolbar' );
			if ( isDistractionFree ) {
				toggleDistractionFree();
			}
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-code-editor',
		label: __( 'Toggle code editor' ),
		icon: code,
		callback: ( { close } ) => {
			switchEditorMode( editorMode === 'visual' ? 'text' : 'visual' );
			close();
		},
	} );

	useCommand( {
		name: 'core/open-preferences',
		label: __( 'Editor preferences' ),
		callback: () => {
			openModal( PREFERENCES_MODAL_NAME );
		},
	} );

	useCommand( {
		name: 'core/open-shortcut-help',
		label: __( 'Keyboard shortcuts' ),
		icon: keyboard,
		callback: () => {
			openModal( KEYBOARD_SHORTCUT_HELP_MODAL_NAME );
		},
	} );

	useCommand( {
		name: 'core/toggle-breadcrumbs',
		label: showBlockBreadcrumbs
			? __( 'Hide block breadcrumbs' )
			: __( 'Show block breadcrumbs' ),
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'showBlockBreadcrumbs' );
			close();
			createInfoNotice(
				showBlockBreadcrumbs
					? __( 'Breadcrumbs hidden.' )
					: __( 'Breadcrumbs visible.' ),
				{
					id: 'core/edit-post/toggle-breadcrumbs/notice',
					type: 'snackbar',
				}
			);
		},
	} );

	useCommand( {
		name: 'core/toggle-publish-sidebar',
		label: isPublishSidebarEnabled
			? __( 'Disable pre-publish checklist' )
			: __( 'Enable pre-publish checklist' ),
		icon: formatListBullets,
		callback: ( { close } ) => {
			close();
			toggle( 'core/edit-post', 'isPublishSidebarEnabled' );
			createInfoNotice(
				isPublishSidebarEnabled
					? __( 'Pre-publish checklist off.' )
					: __( 'Pre-publish checklist on.' ),
				{
					id: 'core/edit-post/publish-sidebar/notice',
					type: 'snackbar',
				}
			);
		},
	} );

	useCommand( {
		name: 'core/preview-link',
		label: __( 'Preview in a new tab' ),
		icon: external,
		callback: async ( { close } ) => {
			close();
			const postId = getCurrentPostId();
			const link = await __unstableSaveForPreview();
			window.open( link, `wp-preview-${ postId }` );
		},
	} );

	useCommand( {
		name: 'core/open-featured-image-modal',
		label: __( 'Select Featured Image' ),
		icon: image,
		callback: ( { close } ) => {
			const currentFeaturedImageId =
				getEditedPostAttribute( 'featured_media' );
			setFeaturedImage( currentFeaturedImageId );
			close();
		},
	} );
}
