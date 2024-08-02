/**
 * External dependencies
 */
import { camelCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { omit } from '../api/utils';

/**
 * @typedef {Object} WPBlockCategory
 *
 * @property {string} slug  Unique category slug.
 * @property {string} title Category label, for display in user interface.
 */

/**
 * Default set of categories.
 *
 * @type {WPBlockCategory[]}
 */
export const DEFAULT_CATEGORIES = [
	{ slug: 'text', title: __( 'Text' ) },
	{ slug: 'media', title: __( 'Media' ) },
	{ slug: 'design', title: __( 'Design' ) },
	{ slug: 'widgets', title: __( 'Widgets' ) },
	{ slug: 'theme', title: __( 'Theme' ) },
	{ slug: 'embed', title: __( 'Embeds' ) },
	{ slug: 'reusable', title: __( 'Reusable blocks' ) },
];

// Key block types by their name.
function keyBlockTypesByName( types ) {
	return types.reduce(
		( newBlockTypes, block ) => ( {
			...newBlockTypes,
			[ block.name ]: block,
		} ),
		{}
	);
}

// Filter items to ensure they're unique by their name.
function getUniqueItemsByName( items ) {
	return items.reduce( ( acc, currentItem ) => {
		if ( ! acc.some( ( item ) => item.name === currentItem.name ) ) {
			acc.push( currentItem );
		}
		return acc;
	}, [] );
}

function bootstrappedBlockTypes( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_BOOTSTRAPPED_BLOCK_TYPE':
			const { name, blockType } = action;
			const serverDefinition = state[ name ];
			let newDefinition;
			// Don't overwrite if already set. It covers the case when metadata
			// was initialized from the server.
			if ( serverDefinition ) {
				// The `blockHooks` prop is not yet included in the server provided
				// definitions and needs to be polyfilled. This can be removed when the
				// minimum supported WordPress is >= 6.4.
				if (
					serverDefinition.blockHooks === undefined &&
					blockType.blockHooks
				) {
					newDefinition = {
						...serverDefinition,
						...newDefinition,
						blockHooks: blockType.blockHooks,
					};
				}

				// The `allowedBlocks` prop is not yet included in the server provided
				// definitions and needs to be polyfilled. This can be removed when the
				// minimum supported WordPress is >= 6.5.
				if (
					serverDefinition.allowedBlocks === undefined &&
					blockType.allowedBlocks
				) {
					newDefinition = {
						...serverDefinition,
						...newDefinition,
						allowedBlocks: blockType.allowedBlocks,
					};
				}
			} else {
				newDefinition = Object.fromEntries(
					Object.entries( blockType )
						.filter(
							( [ , value ] ) =>
								value !== null && value !== undefined
						)
						.map( ( [ key, value ] ) => [
							camelCase( key ),
							value,
						] )
				);
				newDefinition.name = name;
			}

			if ( newDefinition ) {
				return {
					...state,
					[ name ]: newDefinition,
				};
			}

			return state;
		case 'REMOVE_BLOCK_TYPES':
			return omit( state, action.names );
	}

	return state;
}

/**
 * Reducer managing the unprocessed block types in a form passed when registering the by block.
 * It's for internal use only. It allows recomputing the processed block types on-demand after block type filters
 * get added or removed.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function unprocessedBlockTypes( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_UNPROCESSED_BLOCK_TYPE':
			return {
				...state,
				[ action.name ]: action.blockType,
			};
		case 'REMOVE_BLOCK_TYPES':
			return omit( state, action.names );
	}

	return state;
}

/**
 * Reducer managing the processed block types with all filters applied.
 * The state is derived from the `unprocessedBlockTypes` reducer.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function blockTypes( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_BLOCK_TYPES':
			return {
				...state,
				...keyBlockTypesByName( action.blockTypes ),
			};
		case 'REMOVE_BLOCK_TYPES':
			return omit( state, action.names );
	}

	return state;
}

/**
 * Reducer managing the block styles.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function blockStyles( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_BLOCK_TYPES':
			return {
				...state,
				...Object.fromEntries(
					Object.entries(
						keyBlockTypesByName( action.blockTypes )
					).map( ( [ name, blockType ] ) => [
						name,
						getUniqueItemsByName( [
							...( blockType.styles ?? [] ).map( ( style ) => ( {
								...style,
								source: 'block',
							} ) ),
							...( state[ blockType.name ] ?? [] ).filter(
								( { source } ) => 'block' !== source
							),
						] ),
					] )
				),
			};
		case 'ADD_BLOCK_STYLES':
			const updatedStyles = {};
			action.blockNames.forEach( ( blockName ) => {
				updatedStyles[ blockName ] = getUniqueItemsByName( [
					...( state[ blockName ] ?? [] ),
					...action.styles,
				] );
			} );
			return { ...state, ...updatedStyles };
		case 'REMOVE_BLOCK_STYLES':
			return {
				...state,
				[ action.blockName ]: (
					state[ action.blockName ] ?? []
				).filter(
					( style ) => action.styleNames.indexOf( style.name ) === -1
				),
			};
	}

	return state;
}

/**
 * Reducer managing the block variations.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function blockVariations( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_BLOCK_TYPES':
			return {
				...state,
				...Object.fromEntries(
					Object.entries(
						keyBlockTypesByName( action.blockTypes )
					).map( ( [ name, blockType ] ) => {
						return [
							name,
							getUniqueItemsByName( [
								...( blockType.variations ?? [] ).map(
									( variation ) => ( {
										...variation,
										source: 'block',
									} )
								),
								...( state[ blockType.name ] ?? [] ).filter(
									( { source } ) => 'block' !== source
								),
							] ),
						];
					} )
				),
			};
		case 'ADD_BLOCK_VARIATIONS':
			return {
				...state,
				[ action.blockName ]: getUniqueItemsByName( [
					...( state[ action.blockName ] ?? [] ),
					...action.variations,
				] ),
			};
		case 'REMOVE_BLOCK_VARIATIONS':
			return {
				...state,
				[ action.blockName ]: (
					state[ action.blockName ] ?? []
				).filter(
					( variation ) =>
						action.variationNames.indexOf( variation.name ) === -1
				),
			};
	}

	return state;
}

/**
 * Higher-order Reducer creating a reducer keeping track of given block name.
 *
 * @param {string} setActionType Action type.
 *
 * @return {Function} Reducer.
 */
export function createBlockNameSetterReducer( setActionType ) {
	return ( state = null, action ) => {
		switch ( action.type ) {
			case 'REMOVE_BLOCK_TYPES':
				if ( action.names.indexOf( state ) !== -1 ) {
					return null;
				}
				return state;

			case setActionType:
				return action.name || null;
		}

		return state;
	};
}

export const defaultBlockName = createBlockNameSetterReducer(
	'SET_DEFAULT_BLOCK_NAME'
);
export const freeformFallbackBlockName = createBlockNameSetterReducer(
	'SET_FREEFORM_FALLBACK_BLOCK_NAME'
);
export const unregisteredFallbackBlockName = createBlockNameSetterReducer(
	'SET_UNREGISTERED_FALLBACK_BLOCK_NAME'
);
export const groupingBlockName = createBlockNameSetterReducer(
	'SET_GROUPING_BLOCK_NAME'
);

/**
 * Reducer managing the categories
 *
 * @param {WPBlockCategory[]} state  Current state.
 * @param {Object}            action Dispatched action.
 *
 * @return {WPBlockCategory[]} Updated state.
 */
export function categories( state = DEFAULT_CATEGORIES, action ) {
	switch ( action.type ) {
		case 'SET_CATEGORIES':
			// Ensure, that categories are unique by slug.
			const uniqueCategories = new Map();
			( action.categories || [] ).forEach( ( category ) => {
				uniqueCategories.set( category.slug, category );
			} );
			return [ ...uniqueCategories.values() ];
		case 'UPDATE_CATEGORY': {
			if (
				! action.category ||
				! Object.keys( action.category ).length
			) {
				return state;
			}
			const categoryToChange = state.find(
				( { slug } ) => slug === action.slug
			);
			if ( categoryToChange ) {
				return state.map( ( category ) => {
					if ( category.slug === action.slug ) {
						return {
							...category,
							...action.category,
						};
					}
					return category;
				} );
			}
		}
	}
	return state;
}

export function collections( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_BLOCK_COLLECTION':
			return {
				...state,
				[ action.namespace ]: {
					title: action.title,
					icon: action.icon,
				},
			};
		case 'REMOVE_BLOCK_COLLECTION':
			return omit( state, action.namespace );
	}
	return state;
}

/**
 * Merges usesContext with existing values, potentially defined in the server registration.
 *
 * @param {string[]} existingUsesContext Existing `usesContext`.
 * @param {string[]} newUsesContext      Newly added `usesContext`.
 * @return {string[]|undefined} Merged `usesContext`.
 */
function getMergedUsesContext( existingUsesContext = [], newUsesContext = [] ) {
	const mergedArrays = Array.from(
		new Set( existingUsesContext.concat( newUsesContext ) )
	);
	return mergedArrays.length > 0 ? mergedArrays : undefined;
}

export function blockBindingsSources( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_BLOCK_BINDINGS_SOURCE':
			return {
				...state,
				[ action.name ]: {
					// Don't override the label if it's already set.
					label: state[ action.name ]?.label || action.label,
					usesContext: getMergedUsesContext(
						state[ action.name ]?.usesContext,
						action.usesContext
					),
					getValues: action.getValues,
					setValues: action.setValues,
					getPlaceholder: action.getPlaceholder,
					canUserEditValue: action.canUserEditValue,
					getFieldsList: action.getFieldsList,
				},
			};
		case 'ADD_BOOTSTRAPPED_BLOCK_BINDINGS_SOURCE':
			return {
				...state,
				[ action.name ]: {
					/*
					 * Keep the exisitng properties in case the source has been registered
					 * in the client before bootstrapping.
					 */
					...state[ action.name ],
					label: action.label,
					usesContext: getMergedUsesContext(
						state[ action.name ]?.usesContext,
						action.usesContext
					),
				},
			};
		case 'REMOVE_BLOCK_BINDINGS_SOURCE':
			return omit( state, action.name );
	}
	return state;
}

export default combineReducers( {
	bootstrappedBlockTypes,
	unprocessedBlockTypes,
	blockTypes,
	blockStyles,
	blockVariations,
	defaultBlockName,
	freeformFallbackBlockName,
	unregisteredFallbackBlockName,
	groupingBlockName,
	categories,
	collections,
	blockBindingsSources,
} );
