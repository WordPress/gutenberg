/**
 * External dependencies
 */
import createSelector from 'rememo';
import {
	difference,
	get,
	keys,
	omit,
	pick,
	without,
	compact,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockTypes, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './store-defaults';

/**
 * The maximum number of recent blocks to track in state.
 *
 * @type {Number}
 */
const MAX_RECENT_BLOCKS = 8;

/**
 * The maximum number of frequently used blocks to return from selector.
 *
 * @type {Number}
 */
const MAX_FREQUENT_BLOCKS = 3;

/**
 * Reducer
 */

/**
 * Reducer returning the user preferences:
 *
 * @param  {Object}  state                 Current state
 * @param  {string}  state.mode            Current editor mode, either "visual" or "text".
 * @param  {Boolean} state.isSidebarOpened Whether the sidebar is opened or closed
 * @param  {Object}  state.panels          The state of the different sidebar panels
 * @param  {Object}  action                Dispatched action
 * @return {string}                        Updated state
 */
export default function( state = PREFERENCES_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'TOGGLE_SIDEBAR':
			return {
				...state,
				isSidebarOpened: ! state.isSidebarOpened,
			};
		case 'TOGGLE_SIDEBAR_PANEL':
			return {
				...state,
				panels: {
					...state.panels,
					[ action.panel ]: ! get( state, [ 'panels', action.panel ], false ),
				},
			};
		case 'SWITCH_MODE':
			return {
				...state,
				mode: action.mode,
			};
		case 'INSERT_BLOCKS':
			// record the block usage and put the block in the recently used blocks
			let blockUsage = state.blockUsage;
			let recentlyUsedBlocks = [ ...state.recentlyUsedBlocks ];
			action.blocks.forEach( ( block ) => {
				const uses = ( blockUsage[ block.name ] || 0 ) + 1;
				blockUsage = omit( blockUsage, block.name );
				blockUsage[ block.name ] = uses;
				recentlyUsedBlocks = [ block.name, ...without( recentlyUsedBlocks, block.name ) ].slice( 0, MAX_RECENT_BLOCKS );
			} );
			return {
				...state,
				blockUsage,
				recentlyUsedBlocks,
			};
		case 'SETUP_EDITOR':
			const isBlockDefined = name => getBlockType( name ) !== undefined;
			const filterInvalidBlocksFromList = list => list.filter( isBlockDefined );
			const filterInvalidBlocksFromObject = obj => pick( obj, keys( obj ).filter( isBlockDefined ) );
			const commonBlocks = getBlockTypes()
				.filter( ( blockType ) => 'common' === blockType.category )
				.map( ( blockType ) => blockType.name );

			return {
				...state,
				// recently used gets filled up to `MAX_RECENT_BLOCKS` with blocks from the common category
				recentlyUsedBlocks: filterInvalidBlocksFromList( [ ...state.recentlyUsedBlocks ] )
					.concat( difference( commonBlocks, state.recentlyUsedBlocks ) )
					.slice( 0, MAX_RECENT_BLOCKS ),
				blockUsage: filterInvalidBlocksFromObject( state.blockUsage ),
			};
		case 'TOGGLE_FEATURE':
			return {
				...state,
				features: {
					...state.features,
					[ action.feature ]: ! state.features[ action.feature ],
				},
			};
	}

	return state;
}

/**
 * Action creators
 */

/**
 * Returns an action object used in signalling that the user toggled the sidebar
 *
 * @return {Object}         Action object
 */
export function toggleSidebar() {
	return {
		type: 'TOGGLE_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user toggled a sidebar panel
 *
 * @param  {String} panel   The panel name
 * @return {Object}         Action object
 */
export function toggleSidebarPanel( panel ) {
	return {
		type: 'TOGGLE_SIDEBAR_PANEL',
		panel,
	};
}

/**
 * Returns an action object used to toggle a feature flag
 *
 * @param {String}  feature   Featurre name.
 *
 * @return {Object}           Action object
 */
export function toggleFeature( feature ) {
	return {
		type: 'TOGGLE_FEATURE',
		feature,
	};
}

/**
 * Selectors
 */

/**
 * Returns the current editing mode.
 *
 * @param  {Object} state Global application state
 * @return {String}       Editing mode
 */
export function getEditorMode( state ) {
	return getPreference( state, 'mode', 'visual' );
}

/**
 * Returns the preferences (these preferences are persisted locally)
 *
 * @param  {Object}  state Global application state
 * @return {Object}        Preferences Object
 */
export function getPreferences( state ) {
	return state.preferences;
}

/**
 *
 * @param  {Object}  state          Global application state
 * @param  {String}  preferenceKey  Preference Key
 * @param  {Mixed}   defaultValue   Default Value
 * @return {Mixed}                  Preference Value
 */
export function getPreference( state, preferenceKey, defaultValue ) {
	const value = getPreferences( state )[ preferenceKey ];
	return value === undefined ? defaultValue : value;
}

/**
 * Returns true if the editor sidebar is open, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether sidebar is open
 */
export function isEditorSidebarOpened( state ) {
	return getPreference( state, 'isSidebarOpened' );
}

/**
 * Returns true if the editor sidebar panel is open, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {STring}  panel Sidebar panel name
 * @return {Boolean}       Whether sidebar is open
 */
export function isEditorSidebarPanelOpened( state, panel ) {
	const panels = getPreference( state, 'panels' );
	return panels ? !! panels[ panel ] : false;
}

/**
 * Resolves the block usage stats into a list of the most frequently used blocks.
 * Memoized so we're not generating block lists every time we render the list
 * in the inserter.
 *
 * @param {Object} state Global application state
 * @return {Array}       List of block type settings
 */
export const getMostFrequentlyUsedBlocks = createSelector(
	( state ) => {
		const { blockUsage } = state.preferences;
		const orderedByUsage = keys( blockUsage ).sort( ( a, b ) => blockUsage[ b ] - blockUsage[ a ] );
		// add in paragraph and image blocks if they're not already in the usage data
		return compact(
			[ ...orderedByUsage, ...without( [ 'core/paragraph', 'core/image' ], ...orderedByUsage ) ]
				.map( blockType => getBlockType( blockType ) )
		).slice( 0, MAX_FREQUENT_BLOCKS );
	},
	( state ) => state.preferences.blockUsage
);

/**
 * Resolves the list of recently used block names into a list of block type settings.
 *
 * @param {Object} state Global application state
 * @return {Array}       List of recently used blocks
 */
export function getRecentlyUsedBlocks( state ) {
	// resolves the block names in the state to the block type settings
	return compact( state.preferences.recentlyUsedBlocks.map( blockType => getBlockType( blockType ) ) );
}

/**
 * Returns whether the given feature is enabled or not
 *
 * @param {Object}    state   Global application state
 * @param {String}    feature Feature slug
 * @return {Booleean}         Is active
 */
export function isFeatureActive( state, feature ) {
	return !! state.preferences.features[ feature ];
}
