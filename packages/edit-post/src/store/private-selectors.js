import { createSelector, createRegistrySelector } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { getMetaBoxesPerLocation } from './selectors';

/**
 * Returns the ids of the meta boxes that are hidden through the
 * Preferences modal, for the locations rendered in the given meta boxes
 * iframe, as a stable array.
 *
 * @param {Object} state    Global application state.
 * @param {string} location `main` or `side`.
 *
 * @return {string[]} The hidden meta box ids.
 */
export const getHiddenMetaBoxIds = createRegistrySelector( ( select ) =>
	createSelector(
		( state, location ) => {
			const locations =
				location === 'side' ? [ 'side' ] : [ 'normal', 'advanced' ];
			return locations
				.flatMap(
					( boxLocation ) =>
						getMetaBoxesPerLocation( state, boxLocation ) ?? []
				)
				.filter(
					( { id } ) =>
						! select( editorStore ).isEditorPanelEnabled(
							`meta-box-${ id }`
						)
				)
				.map( ( { id } ) => id );
		},
		( state ) => [
			state.metaBoxes.locations,
			select( preferencesStore ).get( 'core', 'inactivePanels' ),
		]
	)
);
