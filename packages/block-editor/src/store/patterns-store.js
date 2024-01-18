/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import {
	createReduxStore,
	registerStore,
	combineReducers,
	createRegistrySelector,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from './';
import { INSERTER_PATTERN_TYPES } from '../components/inserter/block-patterns-tab/utils';

const STORE_NAME = 'core/block-editor/patterns';

const getAllPatterns = createRegistrySelector( ( select ) =>
	createSelector(
		() => {
			const settings = select( blockEditorStore ).getSettings();
			// This setting is left for back compat.
			const {
				__experimentalBlockPatterns,
				__experimentalFetchBlockPatterns,
				__experimentalUserPatternCategories = [],
				__experimentalReusableBlocks = [],
			} = settings;
			const userPatterns = __experimentalReusableBlocks.map(
				( userPattern ) => {
					return {
						name: `core/block/${ userPattern.id }`,
						id: userPattern.id,
						type: INSERTER_PATTERN_TYPES.user,
						title: userPattern.title.raw,
						categories: userPattern.wp_pattern_category.map(
							( catId ) => {
								const category =
									__experimentalUserPatternCategories.find(
										( { id } ) => id === catId
									);
								return category ? category.slug : catId;
							}
						),
						content: userPattern.content.raw,
						syncStatus: userPattern.wp_pattern_sync_status,
					};
				}
			);
			return [
				...userPatterns,
				...__experimentalBlockPatterns,
				...select( store ).getFetchedPatterns(
					__experimentalFetchBlockPatterns
				),
			];
		},
		( state ) => {
			const settings = select( blockEditorStore ).getSettings();
			return [
				settings.__experimentalBlockPatterns,
				settings.__experimentalUserPatternCategories,
				settings.__experimentalReusableBlocks,
				settings.__experimentalFetchBlockPatterns,
				state.blockPatterns,
			];
		}
	)
);

function getFetchedPatterns( state ) {
	return state.blockPatterns;
}

/**
 * Block editor data store configuration.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#registerStore
 */
export const storeConfig = {
	reducer: combineReducers( {
		blockPatterns( state = [], action ) {
			switch ( action.type ) {
				case 'RECEIVE_BLOCK_PATTERNS':
					return action.patterns;
			}

			return state;
		},
	} ),
	selectors: {
		getAllPatterns,
		getFetchedPatterns,
	},
	resolvers: {
		getFetchedPatterns:
			( fetch ) =>
			async ( { dispatch } ) => {
				const patterns = await fetch();
				dispatch( { type: 'RECEIVE_BLOCK_PATTERNS', patterns } );
			},
	},
};

/**
 * Store definition for the block editor namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );

// We will be able to use the `register` function once we switch
// the "preferences" persistence to use the new preferences package.
registerStore( STORE_NAME, {
	...storeConfig,
	persist: [ 'preferences' ],
} );
