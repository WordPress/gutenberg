/**
 * External dependencies
 */
import { castArray, reduce, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { speak } from '@wordpress/a11y';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { getMetaBoxContainer } from '../utils/meta-boxes';
import { store as editPostStore } from '.';

/**
 * Returns an action object used in signalling that the user opened an editor sidebar.
 *
 * @param {?string} name Sidebar name to be opened.
 */
export const openGeneralSidebar = ( name ) => ( { registry } ) =>
	registry
		.dispatch( interfaceStore )
		.enableComplementaryArea( editPostStore.name, name );

/**
 * Returns an action object signalling that the user closed the sidebar.
 */
export const closeGeneralSidebar = () => ( { registry } ) =>
	registry
		.dispatch( interfaceStore )
		.disableComplementaryArea( editPostStore.name );

/**
 * Returns an action object used in signalling that the user opened a modal.
 *
 * @param {string} name A string that uniquely identifies the modal.
 *
 * @return {Object} Action object.
 */
export function openModal( name ) {
	return {
		type: 'OPEN_MODAL',
		name,
	};
}

/**
 * Returns an action object signalling that the user closed a modal.
 *
 * @return {Object} Action object.
 */
export function closeModal() {
	return {
		type: 'CLOSE_MODAL',
	};
}

/**
 * Returns an action object used in signalling that the user opened the publish
 * sidebar.
 *
 * @return {Object} Action object
 */
export function openPublishSidebar() {
	return {
		type: 'OPEN_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user closed the
 * publish sidebar.
 *
 * @return {Object} Action object.
 */
export function closePublishSidebar() {
	return {
		type: 'CLOSE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user toggles the publish sidebar.
 *
 * @return {Object} Action object
 */
export function togglePublishSidebar() {
	return {
		type: 'TOGGLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used to enable or disable a panel in the editor.
 *
 * @param {string} panelName A string that identifies the panel to enable or disable.
 *
 * @return {Object} Action object.
 */
export function toggleEditorPanelEnabled( panelName ) {
	return {
		type: 'TOGGLE_PANEL_ENABLED',
		panelName,
	};
}

/**
 * Returns an action object used to open or close a panel in the editor.
 *
 * @param {string} panelName A string that identifies the panel to open or close.
 *
 * @return {Object} Action object.
 */
export function toggleEditorPanelOpened( panelName ) {
	return {
		type: 'TOGGLE_PANEL_OPENED',
		panelName,
	};
}

/**
 * Returns an action object used to remove a panel from the editor.
 *
 * @param {string} panelName A string that identifies the panel to remove.
 *
 * @return {Object} Action object.
 */
export function removeEditorPanel( panelName ) {
	return {
		type: 'REMOVE_PANEL',
		panelName,
	};
}

/**
 * Triggers an action used to toggle a feature flag.
 *
 * @param {string} feature Feature name.
 */
export const toggleFeature = ( feature ) => ( { registry } ) =>
	registry.dispatch( preferencesStore ).toggle( 'core/edit-post', feature );

/**
 * Triggers an action used to switch editor mode.
 *
 * @param {string} mode The editor mode.
 */
export const switchEditorMode = ( mode ) => ( { registry } ) => {
	registry
		.dispatch( preferencesStore )
		.set( 'core/edit-post', 'editorMode', mode );

	// Unselect blocks when we switch to the code editor.
	if ( mode !== 'visual' ) {
		registry.dispatch( blockEditorStore ).clearSelectedBlock();
	}

	const message =
		mode === 'visual'
			? __( 'Visual editor selected' )
			: __( 'Code editor selected' );
	speak( message, 'assertive' );
};

/**
 * Triggers an action object used to toggle a plugin name flag.
 *
 * @param {string} pluginName Plugin name.
 */
export const togglePinnedPluginItem = ( pluginName ) => ( { registry } ) => {
	const isPinned = registry
		.select( interfaceStore )
		.isItemPinned( 'core/edit-post', pluginName );

	registry
		.dispatch( interfaceStore )
		[ isPinned ? 'unpinItem' : 'pinItem' ]( 'core/edit-post', pluginName );
};

/**
 * Returns an action object used in signaling that a style should be auto-applied when a block is created.
 *
 * @param {string}  blockName  Name of the block.
 * @param {?string} blockStyle Name of the style that should be auto applied. If undefined, the "auto apply" setting of the block is removed.
 */
export const updatePreferredStyleVariations = ( blockName, blockStyle ) => ( {
	registry,
} ) => {
	if ( ! blockName ) {
		return;
	}

	const existingVarations =
		registry
			.select( preferencesStore )
			.get( 'core/edit-post', 'preferredStyleVariations' ) ?? {};

	// When the blockStyle is ommitted, remove the block's preferred variation.
	if ( ! blockStyle ) {
		const updatedVariations = {
			...existingVarations,
		};

		delete updatedVariations[ blockName ];

		registry
			.dispatch( preferencesStore )
			.set(
				'core/edit-post',
				'preferredStyleVariations',
				updatedVariations
			);
	}

	registry
		.dispatch( preferencesStore )
		.set( 'core/edit-post', 'preferredStyleVariations', {
			...existingVarations,
			[ blockName ]: blockStyle,
		} );
};

/**
 * Update the provided block types to be visible.
 *
 * @param {string[]} blockNames Names of block types to show.
 */
export const showBlockTypes = ( blockNames ) => ( { registry } ) => {
	const existingBlockNames =
		registry
			.select( preferencesStore )
			.get( 'core/edit-post', 'hiddenBlockTypes' ) ?? [];

	const newBlockNames = without(
		existingBlockNames,
		...castArray( blockNames )
	);

	registry
		.dispatch( preferencesStore )
		.set( 'core/edit-post', 'hiddenBlockTypes', newBlockNames );
};

/**
 * Update the provided block types to be hidden.
 *
 * @param {string[]} blockNames Names of block types to hide.
 */
export const hideBlockTypes = ( blockNames ) => ( { registry } ) => {
	const existingBlockNames =
		registry
			.select( preferencesStore )
			.get( 'core/edit-post', 'hiddenBlockTypes' ) ?? [];

	const mergedBlockNames = new Set( [
		...existingBlockNames,
		...castArray( blockNames ),
	] );

	registry
		.dispatch( preferencesStore )
		.set( 'core/edit-post', 'hiddenBlockTypes', [ ...mergedBlockNames ] );
};

/**
 * Returns an action object used in signaling
 * what Meta boxes are available in which location.
 *
 * @param {Object} metaBoxesPerLocation Meta boxes per location.
 */
export const setAvailableMetaBoxesPerLocation = ( metaBoxesPerLocation ) => ( {
	dispatch,
} ) =>
	dispatch( {
		type: 'SET_META_BOXES_PER_LOCATIONS',
		metaBoxesPerLocation,
	} );

/**
 * Update a metabox.
 */
export const requestMetaBoxUpdates = () => async ( {
	registry,
	select,
	dispatch,
} ) => {
	dispatch( {
		type: 'REQUEST_META_BOX_UPDATES',
	} );

	// Saves the wp_editor fields.
	if ( window.tinyMCE ) {
		window.tinyMCE.triggerSave();
	}

	// Additional data needed for backward compatibility.
	// If we do not provide this data, the post will be overridden with the default values.
	const post = registry.select( editorStore ).getCurrentPost();
	const additionalData = [
		post.comment_status ? [ 'comment_status', post.comment_status ] : false,
		post.ping_status ? [ 'ping_status', post.ping_status ] : false,
		post.sticky ? [ 'sticky', post.sticky ] : false,
		post.author ? [ 'post_author', post.author ] : false,
	].filter( Boolean );

	// We gather all the metaboxes locations data and the base form data.
	const baseFormData = new window.FormData(
		document.querySelector( '.metabox-base-form' )
	);
	const activeMetaBoxLocations = select.getActiveMetaBoxLocations();
	const formDataToMerge = [
		baseFormData,
		...activeMetaBoxLocations.map(
			( location ) =>
				new window.FormData( getMetaBoxContainer( location ) )
		),
	];

	// Merge all form data objects into a single one.
	const formData = reduce(
		formDataToMerge,
		( memo, currentFormData ) => {
			for ( const [ key, value ] of currentFormData ) {
				memo.append( key, value );
			}
			return memo;
		},
		new window.FormData()
	);
	additionalData.forEach( ( [ key, value ] ) =>
		formData.append( key, value )
	);

	try {
		// Save the metaboxes.
		await apiFetch( {
			url: window._wpMetaBoxUrl,
			method: 'POST',
			body: formData,
			parse: false,
		} );
		dispatch.metaBoxUpdatesSuccess();
	} catch {
		dispatch.metaBoxUpdatesFailure();
	}
};

/**
 * Returns an action object used to signal a successful meta box update.
 *
 * @return {Object} Action object.
 */
export function metaBoxUpdatesSuccess() {
	return {
		type: 'META_BOX_UPDATES_SUCCESS',
	};
}

/**
 * Returns an action object used to signal a failed meta box update.
 *
 * @return {Object} Action object.
 */
export function metaBoxUpdatesFailure() {
	return {
		type: 'META_BOX_UPDATES_FAILURE',
	};
}

/**
 * Returns an action object used to toggle the width of the editing canvas.
 *
 * @param {string} deviceType
 *
 * @return {Object} Action object.
 */
export function __experimentalSetPreviewDeviceType( deviceType ) {
	return {
		type: 'SET_PREVIEW_DEVICE_TYPE',
		deviceType,
	};
}

/**
 * Returns an action object used to open/close the inserter.
 *
 * @param {boolean|Object} value                Whether the inserter should be
 *                                              opened (true) or closed (false).
 *                                              To specify an insertion point,
 *                                              use an object.
 * @param {string}         value.rootClientId   The root client ID to insert at.
 * @param {number}         value.insertionIndex The index to insert at.
 *
 * @return {Object} Action object.
 */
export function setIsInserterOpened( value ) {
	return {
		type: 'SET_IS_INSERTER_OPENED',
		value,
	};
}

/**
 * Returns an action object used to open/close the list view.
 *
 * @param {boolean} isOpen A boolean representing whether the list view should be opened or closed.
 * @return {Object} Action object.
 */
export function setIsListViewOpened( isOpen ) {
	return {
		type: 'SET_IS_LIST_VIEW_OPENED',
		isOpen,
	};
}

/**
 * Returns an action object used to switch to template editing.
 *
 * @param {boolean} value Is editing template.
 * @return {Object} Action object.
 */
export function setIsEditingTemplate( value ) {
	return {
		type: 'SET_IS_EDITING_TEMPLATE',
		value,
	};
}

/**
 * Switches to the template mode.
 *
 * @param {boolean} newTemplate Is new template.
 */
export const __unstableSwitchToTemplateMode = ( newTemplate = false ) => ( {
	registry,
	select,
	dispatch,
} ) => {
	dispatch( setIsEditingTemplate( true ) );
	const isWelcomeGuideActive = select.isFeatureActive(
		'welcomeGuideTemplate'
	);
	if ( ! isWelcomeGuideActive ) {
		const message = newTemplate
			? __( "Custom template created. You're in template mode now." )
			: __(
					'Editing template. Changes made here affect all posts and pages that use the template.'
			  );
		registry.dispatch( noticesStore ).createSuccessNotice( message, {
			type: 'snackbar',
		} );
	}
};

/**
 * Create a block based template.
 *
 * @param {Object?} template Template to create and assign.
 */
export const __unstableCreateTemplate = ( template ) => async ( {
	registry,
} ) => {
	const savedTemplate = await registry
		.dispatch( coreStore )
		.saveEntityRecord( 'postType', 'wp_template', template );
	const post = registry.select( editorStore ).getCurrentPost();
	registry
		.dispatch( coreStore )
		.editEntityRecord( 'postType', post.type, post.id, {
			template: savedTemplate.slug,
		} );
};

let metaBoxesInitialized = false;

/**
 * Initializes WordPress `postboxes` script and the logic for saving meta boxes.
 */
export const initializeMetaBoxes = () => ( { registry, select, dispatch } ) => {
	const isEditorReady = registry
		.select( editorStore )
		.__unstableIsEditorReady();

	if ( ! isEditorReady ) {
		return;
	}
	// Only initialize once.
	if ( metaBoxesInitialized ) {
		return;
	}
	const postType = registry.select( editorStore ).getCurrentPostType();
	if ( window.postboxes.page !== postType ) {
		window.postboxes.add_postbox_toggles( postType );
	}

	metaBoxesInitialized = true;

	let wasSavingPost = registry.select( editorStore ).isSavingPost();
	let wasAutosavingPost = registry.select( editorStore ).isAutosavingPost();
	const hasMetaBoxes = select.hasMetaBoxes();

	// Save metaboxes when performing a full save on the post.
	registry.subscribe( async () => {
		const isSavingPost = registry.select( editorStore ).isSavingPost();
		const isAutosavingPost = registry
			.select( editorStore )
			.isAutosavingPost();

		// Save metaboxes on save completion, except for autosaves that are not a post preview.
		//
		// Meta boxes are initialized once at page load. It is not necessary to
		// account for updates on each state change.
		//
		// See: https://github.com/WordPress/WordPress/blob/5.1.1/wp-admin/includes/post.php#L2307-L2309.
		const shouldTriggerMetaboxesSave =
			hasMetaBoxes &&
			wasSavingPost &&
			! isSavingPost &&
			! wasAutosavingPost;

		// Save current state for next inspection.
		wasSavingPost = isSavingPost;
		wasAutosavingPost = isAutosavingPost;

		if ( shouldTriggerMetaboxesSave ) {
			await dispatch.requestMetaBoxUpdates();
		}
	} );

	dispatch( {
		type: 'META_BOXES_INITIALIZED',
	} );
};
