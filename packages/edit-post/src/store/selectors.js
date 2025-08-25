/**
 * WordPress dependencies
 */
import { createSelector, createRegistrySelector } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as coreStore } from '@wordpress/core-data';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
const { interfaceStore } = unlock( editorPrivateApis );
const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/**
 * Returns the current editing mode.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Editing mode.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useSelect } from '@wordpress/data';
 * import { store as editPostStore } from '@wordpress/edit-post';
 *
 * const EditorModeNotice = () => {
 *     const editorMode = useSelect(
 *         ( select ) => select( editPostStore ).getEditorMode(),
 *         []
 *     );
 *
 *     return (
 *         <p>
 *             { __( 'The current editor mode is: ' ) }
 *             <strong>{ editorMode }</strong>
 *         </p>
 *     );
 * };
 * ```
 */
export const getEditorMode = createRegistrySelector(
	( select ) => () =>
		select( preferencesStore ).get( 'core', 'editorMode' ) ?? 'visual'
);

/**
 * Returns true if the editor sidebar is opened.
 *
 * @param {Object} state Global application state
 *
 * @return {boolean} Whether the editor sidebar is opened.
 *
 * @example
 * ```js
 * import { useSelect } from '@wordpress/data';
 * import { store as editPostStore } from '@wordpress/edit-post';
 *
 * const SidebarStatus = () => {
 *     const isOpen = useSelect(
 *         ( select ) => select( editPostStore ).isEditorSidebarOpened(),
 *         []
 *     );
 *
 *     return (
 *         <p>
 *             Sidebar is { isOpen ? 'open' : 'closed' }.
 *         </p>
 *     );
 * };
 * ```
 */
export const isEditorSidebarOpened = createRegistrySelector(
	( select ) => () => {
		const activeGeneralSidebar =
			select( interfaceStore ).getActiveComplementaryArea( 'core' );
		return [ 'edit-post/document', 'edit-post/block' ].includes(
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
 *
 * @example
 * ```js
 * import { useSelect } from '@wordpress/data';
 * import { store as editPostStore } from '@wordpress/edit-post';
 *
 * const PluginSidebarStatus = () => {
 *     const isOpen = useSelect(
 *         ( select ) => select( editPostStore ).isPluginSidebarOpened(),
 *         []
 *     );
 *
 *     return (
 *         <p>
 *             Plugin sidebar is { isOpen ? 'open' : 'closed' }.
 *         </p>
 *     );
 * };
 * ```
 */
export const isPluginSidebarOpened = createRegistrySelector(
	( select ) => () => {
		const activeGeneralSidebar =
			select( interfaceStore ).getActiveComplementaryArea( 'core' );
		return (
			!! activeGeneralSidebar &&
			! [ 'edit-post/document', 'edit-post/block' ].includes(
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
 *
 * @example
 * ```js
 * import { useSelect } from '@wordpress/data';
 * import { store as editPostStore } from '@wordpress/edit-post';
 *
 * const ActiveSidebar = () => {
 *     const sidebar = useSelect(
 *         ( select ) => select( editPostStore ).getActiveGeneralSidebarName(),
 *         []
 *     );
 *
 *     return (
 *         <p>
 *             { sidebar
 *                 ? `Active sidebar: ${ sidebar }`
 *                 : 'No general sidebar is active.' }
 *         </p>
 *     );
 * };
 * ```
 */
export const getActiveGeneralSidebarName = createRegistrySelector(
	( select ) => () => {
		return select( interfaceStore ).getActiveComplementaryArea( 'core' );
	}
);

/**
 * Converts panels from the new preferences store format to the old format
 * that the post editor previously used.
 *
 * The resultant converted data should look like this:
 * {
 *     panelName: {
 *         enabled: false,
 *         opened: true,
 *     },
 *     anotherPanelName: {
 *         opened: true
 *     },
 * }
 *
 * @param {string[] | undefined} inactivePanels An array of inactive panel names.
 * @param {string[] | undefined} openPanels     An array of open panel names.
 *
 * @return {Object} The converted panel data.
 *
 * @example
 * ```js
 * import { convertPanelsToOldFormat } from '@wordpress/edit-post';
 *
 * // Example with one inactive and two open panels.
 * const inactivePanels = [ 'discussion-panel' ];
 * const openPanels = [ 'discussion-panel', 'categories-panel' ];
 *
 * const result = convertPanelsToOldFormat( inactivePanels, openPanels );
 *
 * console.log( result );
 * // {
 * //   "discussion-panel": { enabled: false, opened: true },
 * //   "categories-panel": { opened: true }
 * // }
 * ```
 */
function convertPanelsToOldFormat( inactivePanels, openPanels ) {
	// First reduce the inactive panels.
	const panelsWithEnabledState = inactivePanels?.reduce(
		( accumulatedPanels, panelName ) => ( {
			...accumulatedPanels,
			[ panelName ]: {
				enabled: false,
			},
		} ),
		{}
	);

	// Then reduce the open panels, passing in the result of the previous
	// reduction as the initial value so that both open and inactive
	// panel state is combined.
	const panels = openPanels?.reduce( ( accumulatedPanels, panelName ) => {
		const currentPanelState = accumulatedPanels?.[ panelName ];
		return {
			...accumulatedPanels,
			[ panelName ]: {
				...currentPanelState,
				opened: true,
			},
		};
	}, panelsWithEnabledState ?? {} );

	// The panels variable will only be set if openPanels wasn't `undefined`.
	// If it isn't set just return `panelsWithEnabledState`, and if that isn't
	// set return an empty object.
	return panels ?? panelsWithEnabledState ?? EMPTY_OBJECT;
}

/**
 * Returns the preferences (these preferences are persisted locally).
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Preferences Object.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * // Get all preferences for the editor.
 * const prefs = select( 'core/edit-post' ).getPreferences();
 * console.log( prefs );
 * // Example output:
 * // {
 * //   panels: { 'categories-panel': { opened: true }, ... },
 * //   editorMode: 'visual',
 * //   hiddenBlockTypes: [ 'core/verse' ],
 * //   ...
 * // }
 * ```
 */
export const getPreferences = createRegistrySelector( ( select ) => () => {
	deprecated( `select( 'core/edit-post' ).getPreferences`, {
		since: '6.0',
		alternative: `select( 'core/preferences' ).get`,
	} );

	const corePreferences = [ 'editorMode', 'hiddenBlockTypes' ].reduce(
		( accumulatedPrefs, preferenceKey ) => {
			const value = select( preferencesStore ).get(
				'core',
				preferenceKey
			);

			return {
				...accumulatedPrefs,
				[ preferenceKey ]: value,
			};
		},
		{}
	);

	// Panels were a preference, but the data structure changed when the state
	// was migrated to the preferences store. They need to be converted from
	// the new preferences store format to old format to ensure no breaking
	// changes for plugins.
	const inactivePanels = select( preferencesStore ).get(
		'core',
		'inactivePanels'
	);
	const openPanels = select( preferencesStore ).get( 'core', 'openPanels' );
	const panels = convertPanelsToOldFormat( inactivePanels, openPanels );

	return {
		...corePreferences,
		panels,
	};
} );

/**
 * @deprecated
 *
 * @param {Object} state         Global application state.
 * @param {string} preferenceKey Preference Key.
 * @param {*}      defaultValue  Default Value.
 *
 * @return {*} Preference Value.
 */
export function getPreference( state, preferenceKey, defaultValue ) {
	deprecated( `select( 'core/edit-post' ).getPreference`, {
		since: '6.0',
		alternative: `select( 'core/preferences' ).get`,
	} );

	// Avoid using the `getPreferences` registry selector where possible.
	const preferences = getPreferences( state );
	const value = preferences[ preferenceKey ];
	return value === undefined ? defaultValue : value;
}

/**
 * Returns an array of blocks that are hidden.
 *
 * @return {Array} A list of the hidden block types
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * // Get all hidden block types in the editor.
 * const hiddenBlocks = select( 'core/edit-post' ).getHiddenBlockTypes();
 * console.log( hiddenBlocks );
 * // Example output:
 * // [ "core/verse", "core/quote" ]
 *
 * // You can also check if a particular block type is hidden:
 * console.log( hiddenBlocks.includes( "core/verse" ) ); // true or false
 * ```
 */
export const getHiddenBlockTypes = createRegistrySelector( ( select ) => () => {
	return (
		select( preferencesStore ).get( 'core', 'hiddenBlockTypes' ) ??
		EMPTY_ARRAY
	);
} );

/**
 * Returns true if the publish sidebar is opened.
 *
 * @deprecated
 *
 * @param {Object} state Global application state
 *
 * @return {boolean} Whether the publish sidebar is open.
 */
export const isPublishSidebarOpened = createRegistrySelector(
	( select ) => () => {
		deprecated( `select( 'core/edit-post' ).isPublishSidebarOpened`, {
			since: '6.6',
			alternative: `select( 'core/editor' ).isPublishSidebarOpened`,
		} );
		return select( editorStore ).isPublishSidebarOpened();
	}
);

/**
 * Returns true if the given panel was programmatically removed, or false otherwise.
 * All panels are not removed by default.
 *
 * @deprecated
 *
 * @param {Object} state     Global application state.
 * @param {string} panelName A string that identifies the panel.
 *
 * @return {boolean} Whether or not the panel is removed.
 */
export const isEditorPanelRemoved = createRegistrySelector(
	( select ) => ( state, panelName ) => {
		deprecated( `select( 'core/edit-post' ).isEditorPanelRemoved`, {
			since: '6.5',
			alternative: `select( 'core/editor' ).isEditorPanelRemoved`,
		} );
		return select( editorStore ).isEditorPanelRemoved( panelName );
	}
);

/**
 * Returns true if the given panel is enabled, or false otherwise. Panels are
 * enabled by default.
 *
 * @deprecated
 *
 * @param {Object} state     Global application state.
 * @param {string} panelName A string that identifies the panel.
 *
 * @return {boolean} Whether or not the panel is enabled.
 */
export const isEditorPanelEnabled = createRegistrySelector(
	( select ) => ( state, panelName ) => {
		deprecated( `select( 'core/edit-post' ).isEditorPanelEnabled`, {
			since: '6.5',
			alternative: `select( 'core/editor' ).isEditorPanelEnabled`,
		} );
		return select( editorStore ).isEditorPanelEnabled( panelName );
	}
);

/**
 * Returns true if the given panel is open, or false otherwise. Panels are
 * closed by default.
 *
 * @deprecated
 *
 * @param {Object} state     Global application state.
 * @param {string} panelName A string that identifies the panel.
 *
 * @return {boolean} Whether or not the panel is open.
 */
export const isEditorPanelOpened = createRegistrySelector(
	( select ) => ( state, panelName ) => {
		deprecated( `select( 'core/edit-post' ).isEditorPanelOpened`, {
			since: '6.5',
			alternative: `select( 'core/editor' ).isEditorPanelOpened`,
		} );
		return select( editorStore ).isEditorPanelOpened( panelName );
	}
);

/**
 * Returns true if a modal is active, or false otherwise.
 *
 * @deprecated since WP 6.3 use `core/interface` store's selector with the same name instead.
 *
 * @param {Object} state     Global application state.
 * @param {string} modalName A string that uniquely identifies the modal.
 *
 * @return {boolean} Whether the modal is active.
 */
export const isModalActive = createRegistrySelector(
	( select ) => ( state, modalName ) => {
		deprecated( `select( 'core/edit-post' ).isModalActive`, {
			since: '6.3',
			alternative: `select( 'core/interface' ).isModalActive`,
		} );
		return !! select( interfaceStore ).isModalActive( modalName );
	}
);

/**
 * Returns whether the given feature is enabled or not.
 *
 * @param {Object} state   Global application state.
 * @param {string} feature Feature slug.
 *
 * @return {boolean} Is active.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * // Check if the editor is currently in fullscreen mode.
 * const isActive = select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' );
 * console.log( isActive ); // true or false
 *
 * // Example usage: toggle UI depending on feature state.
 * if ( isActive ) {
 *     console.log( 'The editor is in fullscreen mode.' );
 * } else {
 *     console.log( 'Fullscreen mode is disabled.' );
 * }
 * ```
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
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * // Check if a plugin toolbar item is pinned.
 * const pinned = select( 'core/edit-post' ).isPluginItemPinned( 'my-plugin' );
 * console.log( pinned ); // true or false
 *
 * // Example: use this to decide whether to render a "pin/unpin" button in your plugin UI.
 * if ( pinned ) {
 *     console.log( 'The plugin item is pinned in the toolbar.' );
 * } else {
 *     console.log( 'The plugin item is not pinned.' );
 * }
 * ```
 */
export const isPluginItemPinned = createRegistrySelector(
	( select ) => ( state, pluginName ) => {
		return select( interfaceStore ).isItemPinned( 'core', pluginName );
	}
);

/**
 * Returns an array of active meta box locations.
 *
 * @param {Object} state Post editor state.
 *
 * @return {string[]} Active meta box locations.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * const locations = select( 'core/edit-post' ).getActiveMetaBoxLocations();
 * console.log( locations ); // e.g. [ 'side', 'normal' ]
 *
 * // Example usage: check if the "side" location has any meta boxes
 * if ( locations.includes( 'side' ) ) {
 *     console.log( 'There are meta boxes in the sidebar.' );
 * }
 * ```
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
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useSelect } from '@wordpress/data';
 * import { store as editPostStore } from '@wordpress/edit-post';
 *
 * const NormalMetaBoxesIndicator = () => {
 *     const isNormalVisible = useSelect(
 *         ( select ) => select( editPostStore ).isMetaBoxLocationVisible( 'normal' ),
 *         []
 *     );
 *
 *     return isNormalVisible ? (
 *         <p>{ __( 'Normal meta boxes are visible.' ) }</p>
 *     ) : (
 *         <p>{ __( 'No visible normal meta boxes.' ) }</p>
 *     );
 * };
 * ```
 */
export const isMetaBoxLocationVisible = createRegistrySelector(
	( select ) => ( state, location ) => {
		return (
			isMetaBoxLocationActive( state, location ) &&
			getMetaBoxesPerLocation( state, location )?.some( ( { id } ) => {
				return select( editorStore ).isEditorPanelEnabled(
					`meta-box-${ id }`
				);
			} )
		);
	}
);

/**
 * Returns true if there is an active meta box in the given location, or false
 * otherwise.
 *
 * @param {Object} state    Post editor state.
 * @param {string} location Meta box location to test.
 *
 * @return {boolean} Whether the meta box location is active.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useSelect } from '@wordpress/data';
 * import { store as editPostStore } from '@wordpress/edit-post';
 *
 * const SideMetaBoxesIndicator = () => {
 *     const isSideActive = useSelect(
 *         ( select ) => select( editPostStore ).isMetaBoxLocationActive( 'side' ),
 *         []
 *     );
 *
 *     return isSideActive ? (
 *         <p>{ __( 'Side meta boxes are active.' ) }</p>
 *     ) : (
 *         <p>{ __( 'No side meta boxes.' ) }</p>
 *     );
 * };
 * ```
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
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * const sideMetaBoxes = select( 'core/edit-post' ).getMetaBoxesPerLocation( 'side' );
 * console.log( sideMetaBoxes );
 *
 * // Example: iterate over meta boxes
 * sideMetaBoxes.forEach( ( box ) => {
 *     console.log( box.id, box.title );
 * } );
 * ```
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
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * const metaBoxes = select( 'core/edit-post' ).getAllMetaBoxes();
 * console.log( metaBoxes );
 *
 * // Example shape of the result:
 * // {
 * //   side: [
 * //     { id: 'submitdiv', title: 'Publish' },
 * //     { id: 'tagsdiv-post_tag', title: 'Tags' }
 * //   ],
 * //   normal: [
 * //     { id: 'postexcerpt', title: 'Excerpt' }
 * //   ]
 * // }
 * ```
 */
export const getAllMetaBoxes = createSelector(
	( state ) => {
		return Object.values( state.metaBoxes.locations ).flat();
	},
	( state ) => [ state.metaBoxes.locations ]
);

/**
 * Returns true if the post is using Meta Boxes
 *
 * @param {Object} state Global application state
 *
 * @return {boolean} Whether there are metaboxes or not.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { useSelect } from '@wordpress/data';
 * import { store as editPostStore } from '@wordpress/edit-post';
 *
 * const ExampleComponent = () => {
 *     const hasMetaBoxes = useSelect(
 *         ( select ) => select( editPostStore ).hasMetaBoxes(),
 *         []
 *     );
 *
 *     return hasMetaBoxes ? (
 *         <p>{ __( 'This post type uses meta boxes.' ) }</p>
 *     ) : (
 *         <p>{ __( 'No meta boxes registered for this post type.' ) }</p>
 *     );
 * };
 * ```
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
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * const saving = select( 'core/edit-post' ).isSavingMetaBoxes();
 * console.log( saving ); // true while meta boxes are saving, false otherwise
 * ```
 */
export function isSavingMetaBoxes( state ) {
	return state.metaBoxes.isSaving;
}

/**
 * Returns the current editing canvas device type.
 *
 * @deprecated
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Device type.
 */
export const __experimentalGetPreviewDeviceType = createRegistrySelector(
	( select ) => () => {
		deprecated(
			`select( 'core/edit-site' ).__experimentalGetPreviewDeviceType`,
			{
				since: '6.5',
				version: '6.7',
				alternative: `select( 'core/editor' ).getDeviceType`,
			}
		);
		return select( editorStore ).getDeviceType();
	}
);

/**
 * Returns true if the inserter is opened.
 *
 * @deprecated
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the inserter is opened.
 */
export const isInserterOpened = createRegistrySelector( ( select ) => () => {
	deprecated( `select( 'core/edit-post' ).isInserterOpened`, {
		since: '6.5',
		alternative: `select( 'core/editor' ).isInserterOpened`,
	} );
	return select( editorStore ).isInserterOpened();
} );

/**
 * Get the insertion point for the inserter.
 *
 * @deprecated
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID, index to insert at and starting filter value.
 */
export const __experimentalGetInsertionPoint = createRegistrySelector(
	( select ) => () => {
		deprecated(
			`select( 'core/edit-post' ).__experimentalGetInsertionPoint`,
			{
				since: '6.5',
				version: '6.7',
			}
		);
		return unlock( select( editorStore ) ).getInserter();
	}
);

/**
 * Returns true if the list view is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the list view is opened.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * const listViewOpen = select( 'core/edit-post' ).isListViewOpened();
 * console.log( listViewOpen ); // true if List View is visible, false otherwise
 * ```
 */
export const isListViewOpened = createRegistrySelector( ( select ) => () => {
	deprecated( `select( 'core/edit-post' ).isListViewOpened`, {
		since: '6.5',
		alternative: `select( 'core/editor' ).isListViewOpened`,
	} );
	return select( editorStore ).isListViewOpened();
} );

/**
 * Returns true if the template editing mode is enabled.
 *
 * @deprecated
 */
export const isEditingTemplate = createRegistrySelector( ( select ) => () => {
	deprecated( `select( 'core/edit-post' ).isEditingTemplate`, {
		since: '6.5',
		alternative: `select( 'core/editor' ).getRenderingMode`,
	} );
	return select( editorStore ).getCurrentPostType() === 'wp_template';
} );

/**
 * Returns true if meta boxes are initialized.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether meta boxes are initialized.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * const initialized = select( 'core/edit-post' ).areMetaBoxesInitialized();
 * console.log( initialized ); // true or false
 * ```
 */
export function areMetaBoxesInitialized( state ) {
	return state.metaBoxes.initialized;
}

/**
 * Retrieves the template of the currently edited post.
 *
 * @return {?Object} Post Template.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 *
 * const template = select( 'core/edit-post' ).getEditedPostTemplate();
 * console.log( template );
 * // Example output:
 * // {
 * //   slug: "my-custom-template",
 * //   theme: "my-theme",
 * //   source: "theme",
 * //   ...etc
 * // }
 * ```
 */
export const getEditedPostTemplate = createRegistrySelector(
	( select ) => () => {
		const { id: postId, type: postType } =
			select( editorStore ).getCurrentPost();
		const templateId = unlock( select( coreStore ) ).getTemplateId(
			postType,
			postId
		);
		if ( ! templateId ) {
			return undefined;
		}
		return select( coreStore ).getEditedEntityRecord(
			'postType',
			'wp_template',
			templateId
		);
	}
);
