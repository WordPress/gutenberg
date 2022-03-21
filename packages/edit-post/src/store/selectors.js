/**
 * External dependencies
 */
import createSelector from 'rememo';
import { get, includes, some, flatten, values } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

const EMPTY_ARRAY = [];

/**
 * Returns the current editing mode.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Editing mode.
 */
export const getEditorMode = createRegistrySelector( ( select ) => () =>
	select( preferencesStore ).get( 'core/edit-post', 'editorMode' ) ?? 'visual'
);

/**
 * Returns true if the editor sidebar is opened.
 *
 * @param {Object} state Global application state
 *
 * @return {boolean} Whether the editor sidebar is opened.
 */
export const isEditorSidebarOpened = createRegistrySelector(
	( select ) => () => {
		const activeGeneralSidebar = select(
			interfaceStore
		).getActiveComplementaryArea( 'core/edit-post' );
		return includes(
			[ 'edit-post/document', 'edit-post/block' ],
			activeGeneralSidebar
		);
	}
);

/**
 * Returns true if the plugin sidebar is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the plugin sidebar is opened.
 */
export const isPluginSidebarOpened = createRegistrySelector(
	( select ) => () => {
		const activeGeneralSidebar = select(
			interfaceStore
		).getActiveComplementaryArea( 'core/edit-post' );
		return (
			!! activeGeneralSidebar &&
			! includes(
				[ 'edit-post/document', 'edit-post/block' ],
				activeGeneralSidebar
			)
		);
	}
);

/**
 * Returns the current active general sidebar name, or null if there is no
 * general sidebar active. The active general sidebar is a unique name to
 * identify either an editor or plugin sidebar.
 *
 * Examples:
 *
 *  - `edit-post/document`
 *  - `my-plugin/insert-image-sidebar`
 *
 * @param {Object} state Global application state.
 *
 * @return {?string} Active general sidebar name.
 */
export const getActiveGeneralSidebarName = createRegistrySelector(
	( select ) => () => {
		return select( interfaceStore ).getActiveComplementaryArea(
			'core/edit-post'
		);
	}
);

// The current list of preference keys that have been migrated to the
// preferences package.
const MIGRATED_KEYS = [
	'hiddenBlockTypes',
	'editorMode',
	'preferredStyleVariations',
];

/**
 * Returns the preferences (these preferences are persisted locally).
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Preferences Object.
 */
export const getPreferences = createRegistrySelector(
	( select ) => ( state ) => {
		const editPostPreferences = state.preferences;

		// Some preferences now exist in the preferences store.
		// Fetch them so that they can be merged into the post
		// editor preferences.
		const preferenceStorePreferences = MIGRATED_KEYS.reduce(
			( accumulatedPrefs, preferenceKey ) => {
				const value = select( preferencesStore ).get(
					'core/edit-post',
					preferenceKey
				);

				return {
					...accumulatedPrefs,
					[ preferenceKey ]: value,
				};
			},
			{}
		);

		return {
			...editPostPreferences,
			...preferenceStorePreferences,
		};
	}
);

/**
 *
 * @param {Object} state         Global application state.
 * @param {string} preferenceKey Preference Key.
 * @param {*}      defaultValue  Default Value.
 *
 * @return {*} Preference Value.
 */
export function getPreference( state, preferenceKey, defaultValue ) {
	// Avoid using the `getPreferences` registry selector where possible.
	const isMigratedKey = MIGRATED_KEYS.includes( preferenceKey );
	const preferences = isMigratedKey
		? getPreferences( state )
		: state.preferences;
	const value = preferences[ preferenceKey ];
	return value === undefined ? defaultValue : value;
}

/**
 * Returns an array of blocks that are hidden.
 *
 * @return {Array} A list of the hidden block types
 */
export const getHiddenBlockTypes = createRegistrySelector( ( select ) => () => {
	return (
		select( preferencesStore ).get(
			'core/edit-post',
			'hiddenBlockTypes'
		) ?? EMPTY_ARRAY
	);
} );

/**
 * Returns true if the publish sidebar is opened.
 *
 * @param {Object} state Global application state
 *
 * @return {boolean} Whether the publish sidebar is open.
 */
export function isPublishSidebarOpened( state ) {
	return state.publishSidebarActive;
}

/**
 * Returns true if the given panel was programmatically removed, or false otherwise.
 * All panels are not removed by default.
 *
 * @param {Object} state     Global application state.
 * @param {string} panelName A string that identifies the panel.
 *
 * @return {boolean} Whether or not the panel is removed.
 */
export function isEditorPanelRemoved( state, panelName ) {
	return includes( state.removedPanels, panelName );
}

/**
 * Returns true if the given panel is enabled, or false otherwise. Panels are
 * enabled by default.
 *
 * @param {Object} state     Global application state.
 * @param {string} panelName A string that identifies the panel.
 *
 * @return {boolean} Whether or not the panel is enabled.
 */
export function isEditorPanelEnabled( state, panelName ) {
	const panels = getPreference( state, 'panels' );

	return (
		! isEditorPanelRemoved( state, panelName ) &&
		get( panels, [ panelName, 'enabled' ], true )
	);
}

/**
 * Returns true if the given panel is open, or false otherwise. Panels are
 * closed by default.
 *
 * @param {Object} state     Global application state.
 * @param {string} panelName A string that identifies the panel.
 *
 * @return {boolean} Whether or not the panel is open.
 */
export function isEditorPanelOpened( state, panelName ) {
	const panels = getPreference( state, 'panels' );
	return (
		get( panels, [ panelName ] ) === true ||
		get( panels, [ panelName, 'opened' ] ) === true
	);
}

/**
 * Returns true if a modal is active, or false otherwise.
 *
 * @param {Object} state     Global application state.
 * @param {string} modalName A string that uniquely identifies the modal.
 *
 * @return {boolean} Whether the modal is active.
 */
export function isModalActive( state, modalName ) {
	return state.activeModal === modalName;
}

/**
 * Returns whether the given feature is enabled or not.
 *
 * @param {Object} state   Global application state.
 * @param {string} feature Feature slug.
 *
 * @return {boolean} Is active.
 */
export const isFeatureActive = createRegistrySelector(
	( select ) => ( state, feature ) => {
		return !! select( preferencesStore ).get( 'core/edit-post', feature );
	}
);

/**
 * Returns true if the plugin item is pinned to the header.
 * When the value is not set it defaults to true.
 *
 * @param {Object} state      Global application state.
 * @param {string} pluginName Plugin item name.
 *
 * @return {boolean} Whether the plugin item is pinned.
 */
export const isPluginItemPinned = createRegistrySelector(
	( select ) => ( state, pluginName ) => {
		return select( interfaceStore ).isItemPinned(
			'core/edit-post',
			pluginName
		);
	}
);

/**
 * Returns an array of active meta box locations.
 *
 * @param {Object} state Post editor state.
 *
 * @return {string[]} Active meta box locations.
 */
export const getActiveMetaBoxLocations = createSelector(
	( state ) => {
		return Object.keys( state.metaBoxes.locations ).filter( ( location ) =>
			isMetaBoxLocationActive( state, location )
		);
	},
	( state ) => [ state.metaBoxes.locations ]
);

/**
 * Returns true if a metabox location is active and visible
 *
 * @param {Object} state    Post editor state.
 * @param {string} location Meta box location to test.
 *
 * @return {boolean} Whether the meta box location is active and visible.
 */
export function isMetaBoxLocationVisible( state, location ) {
	return (
		isMetaBoxLocationActive( state, location ) &&
		some( getMetaBoxesPerLocation( state, location ), ( { id } ) => {
			return isEditorPanelEnabled( state, `meta-box-${ id }` );
		} )
	);
}

/**
 * Returns true if there is an active meta box in the given location, or false
 * otherwise.
 *
 * @param {Object} state    Post editor state.
 * @param {string} location Meta box location to test.
 *
 * @return {boolean} Whether the meta box location is active.
 */
export function isMetaBoxLocationActive( state, location ) {
	const metaBoxes = getMetaBoxesPerLocation( state, location );
	return !! metaBoxes && metaBoxes.length !== 0;
}

/**
 * Returns the list of all the available meta boxes for a given location.
 *
 * @param {Object} state    Global application state.
 * @param {string} location Meta box location to test.
 *
 * @return {?Array} List of meta boxes.
 */
export function getMetaBoxesPerLocation( state, location ) {
	return state.metaBoxes.locations[ location ];
}

/**
 * Returns the list of all the available meta boxes.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} List of meta boxes.
 */
export const getAllMetaBoxes = createSelector(
	( state ) => {
		return flatten( values( state.metaBoxes.locations ) );
	},
	( state ) => [ state.metaBoxes.locations ]
);

/**
 * Returns true if the post is using Meta Boxes
 *
 * @param {Object} state Global application state
 *
 * @return {boolean} Whether there are metaboxes or not.
 */
export function hasMetaBoxes( state ) {
	return getActiveMetaBoxLocations( state ).length > 0;
}

/**
 * Returns true if the Meta Boxes are being saved.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the metaboxes are being saved.
 */
export function isSavingMetaBoxes( state ) {
	return state.metaBoxes.isSaving;
}

/**
 * Returns the current editing canvas device type.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Device type.
 */
export function __experimentalGetPreviewDeviceType( state ) {
	return state.deviceType;
}

/**
 * Returns true if the inserter is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the inserter is opened.
 */
export function isInserterOpened( state ) {
	return !! state.blockInserterPanel;
}

/**
 * Get the insertion point for the inserter.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID, index to insert at and starting filter value.
 */
export function __experimentalGetInsertionPoint( state ) {
	const {
		rootClientId,
		insertionIndex,
		filterValue,
	} = state.blockInserterPanel;
	return { rootClientId, insertionIndex, filterValue };
}

/**
 * Returns true if the list view is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the list view is opened.
 */
export function isListViewOpened( state ) {
	return state.listViewPanel;
}

/**
 * Returns true if the template editing mode is enabled.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether we're editing the template.
 */
export function isEditingTemplate( state ) {
	return state.isEditingTemplate;
}

/**
 * Returns true if meta boxes are initialized.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether meta boxes are initialized.
 */
export function areMetaBoxesInitialized( state ) {
	return state.metaBoxes.initialized;
}

/**
 * Retrieves the template of the currently edited post.
 *
 * @return {Object?} Post Template.
 */
export const getEditedPostTemplate = createRegistrySelector(
	( select ) => () => {
		const currentTemplate = select( editorStore ).getEditedPostAttribute(
			'template'
		);
		if ( currentTemplate ) {
			const templateWithSameSlug = select( coreStore )
				.getEntityRecords( 'postType', 'wp_template', { per_page: -1 } )
				?.find( ( template ) => template.slug === currentTemplate );
			if ( ! templateWithSameSlug ) {
				return templateWithSameSlug;
			}
			return select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_template',
				templateWithSameSlug.id
			);
		}

		const post = select( editorStore ).getCurrentPost();
		if ( post.link ) {
			return select( coreStore ).__experimentalGetTemplateForLink(
				post.link
			);
		}

		return null;
	}
);
