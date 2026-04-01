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
import type {
	BlockType,
	BlockCategory,
	BlockCollection,
	BlockStyle,
	BlockVariation,
	BlockBindingsSource,
	Icon,
} from '../types';
import type { Action } from './types';

/**
 * Default set of categories.
 */
export const DEFAULT_CATEGORIES: BlockCategory[] = [
	{ slug: 'text', title: __( 'Text' ) },
	{ slug: 'media', title: __( 'Media' ) },
	{ slug: 'design', title: __( 'Design' ) },
	{ slug: 'widgets', title: __( 'Widgets' ) },
	{ slug: 'theme', title: __( 'Theme' ) },
	{ slug: 'embed', title: __( 'Embeds' ) },
	{ slug: 'reusable', title: __( 'Reusable blocks' ) },
];

// Key block types by their name.
function keyBlockTypesByName(
	types: BlockType[]
): Record< string, BlockType > {
	return types.reduce(
		( newBlockTypes: Record< string, BlockType >, block ) => ( {
			...newBlockTypes,
			[ block.name ]: block,
		} ),
		{}
	);
}

// Filter items to ensure they're unique by their name.
function getUniqueItemsByName< T extends { name: string } >( items: T[] ): T[] {
	return items.reduce( ( acc: T[], currentItem ) => {
		if ( ! acc.some( ( item ) => item.name === currentItem.name ) ) {
			acc.push( currentItem );
		}
		return acc;
	}, [] );
}

function bootstrappedBlockTypes(
	state: Record< string, Partial< BlockType > > = {},
	action: Action
): Record< string, Partial< BlockType > > {
	switch ( action.type ) {
		case 'ADD_BOOTSTRAPPED_BLOCK_TYPE':
			const { name, blockType } = action;
			const serverDefinition = state[ name ];
			// Don't overwrite if already set. It covers the case when metadata
			// was initialized from the server.
			if ( serverDefinition ) {
				return state;
			}
			const newDefinition: Record< string, unknown > = Object.fromEntries(
				Object.entries( blockType )
					.filter(
						( [ , value ] ) => value !== null && value !== undefined
					)
					.map( ( [ key, value ] ) => [ camelCase( key ), value ] )
			);
			newDefinition.name = name;
			return {
				...state,
				[ name ]: newDefinition as Partial< BlockType >,
			};

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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function unprocessedBlockTypes(
	state: Record< string, Partial< BlockType > > = {},
	action: Action
): Record< string, Partial< BlockType > > {
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function blockTypes(
	state: Record< string, BlockType > = {},
	action: Action
): Record< string, BlockType > {
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function blockStyles(
	state: Record< string, BlockStyle[] > = {},
	action: Action
): Record< string, BlockStyle[] > {
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
			const updatedStyles: Record< string, BlockStyle[] > = {};
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function blockVariations(
	state: Record< string, BlockVariation[] > = {},
	action: Action
): Record< string, BlockVariation[] > {
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
 * @param setActionType Action type.
 *
 * @return Reducer.
 */
export function createBlockNameSetterReducer( setActionType: string ) {
	return ( state: string | null = null, action: Action ): string | null => {
		switch ( action.type ) {
			case 'REMOVE_BLOCK_TYPES':
				if ( action.names.indexOf( state! ) !== -1 ) {
					return null;
				}
				return state;

			case setActionType:
				return ( action as { name?: string } ).name || null;
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
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Updated state.
 */
export function categories(
	state: BlockCategory[] = DEFAULT_CATEGORIES,
	action: Action
): BlockCategory[] {
	switch ( action.type ) {
		case 'SET_CATEGORIES':
			// Ensure, that categories are unique by slug.
			const uniqueCategories = new Map< string, BlockCategory >();
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

export function collections(
	state: Record< string, BlockCollection > = {},
	action: Action
): Record< string, BlockCollection > {
	switch ( action.type ) {
		case 'ADD_BLOCK_COLLECTION':
			return {
				...state,
				[ action.namespace ]: {
					title: action.title,
					icon: action.icon as Icon | undefined,
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
 * @param existingUsesContext Existing `usesContext`.
 * @param newUsesContext      Newly added `usesContext`.
 * @return Merged `usesContext`.
 */
function getMergedUsesContext(
	existingUsesContext: string[] = [],
	newUsesContext: string[] = []
): string[] | undefined {
	const mergedArrays = Array.from(
		new Set( existingUsesContext.concat( newUsesContext ) )
	);
	return mergedArrays.length > 0 ? mergedArrays : undefined;
}

export function blockBindingsSources(
	state: Record< string, Omit< BlockBindingsSource, 'name' > > = {},
	action: Action
): Record< string, Omit< BlockBindingsSource, 'name' > > {
	switch ( action.type ) {
		case 'ADD_BLOCK_BINDINGS_SOURCE':
			return {
				...state,
				[ action.name ]: {
					label: action.label || state[ action.name ]?.label,
					usesContext: getMergedUsesContext(
						state[ action.name ]?.usesContext,
						action.usesContext
					),
					getValues: action.getValues,
					setValues: action.setValues,
					// Only set `canUserEditValue` if `setValues` is also defined.
					canUserEditValue:
						action.setValues && action.canUserEditValue,
					getFieldsList:
						action.getFieldsList as BlockBindingsSource[ 'getFieldsList' ],
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
