/**
 * WordPress dependencies
 */
import { createSelector, createRegistrySelector } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { getBlockType } from './selectors';
import { getValueFromObjectPath } from './utils';
import { __EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY } from '../api/constants';
import type { BlockStoreState } from './types';
import type { BlockAttribute, BlockBindingsSource, BlockType } from '../types';

const ROOT_BLOCK_SUPPORTS: string[] = [
	'background',
	'backgroundColor',
	'color',
	'linkColor',
	'captionColor',
	'buttonColor',
	'headingColor',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'padding',
	'contentSize',
	'wideSize',
	'blockGap',
	'textAlign',
	'textDecoration',
	'textIndent',
	'textTransform',
	'letterSpacing',
];

/**
 * Filters the list of supported styles for a given element.
 *
 * @param blockSupports list of supported styles.
 * @param name          block name.
 * @param element       element name.
 *
 * @return filtered list of supported styles.
 */
function filterElementBlockSupports(
	blockSupports: string[],
	name: string | undefined,
	element: string | undefined
): string[] {
	return blockSupports.filter( ( support ) => {
		if ( support === 'fontSize' && element === 'heading' ) {
			return false;
		}

		// This is only available for links
		if ( support === 'textDecoration' && ! name && element !== 'link' ) {
			return false;
		}

		// This is only available for heading, button, caption and text
		if (
			support === 'textTransform' &&
			! name &&
			! (
				[ 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].includes(
					element as string
				) ||
				element === 'button' ||
				element === 'caption' ||
				element === 'text'
			)
		) {
			return false;
		}

		// This is only available for heading, button, caption and text
		if (
			support === 'letterSpacing' &&
			! name &&
			! (
				[ 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].includes(
					element as string
				) ||
				element === 'button' ||
				element === 'caption' ||
				element === 'text'
			)
		) {
			return false;
		}

		// Text indent is only available for blocks, not elements
		if ( support === 'textIndent' && ! name ) {
			return false;
		}

		// Text columns is only available for blocks.
		if ( support === 'textColumns' && ! name ) {
			return false;
		}

		return true;
	} );
}

/**
 * Returns the list of supported styles for a given block name and element.
 */
export const getSupportedStyles = createSelector(
	(
		state: BlockStoreState,
		name: string | undefined,
		element: string | undefined
	): string[] => {
		if ( ! name ) {
			return filterElementBlockSupports(
				ROOT_BLOCK_SUPPORTS,
				name,
				element
			);
		}

		const blockType = getBlockType( state, name );

		if ( ! blockType ) {
			return [];
		}

		const supportKeys: string[] = [];

		// Check for blockGap support.
		// Block spacing support doesn't map directly to a single style property, so needs to be handled separately.
		const supports = blockType?.supports as
			| Record< string, unknown >
			| undefined;
		if (
			( supports?.spacing as Record< string, unknown > | undefined )
				?.blockGap
		) {
			supportKeys.push( 'blockGap' );
		}

		// check for shadow support
		if ( supports?.shadow ) {
			supportKeys.push( 'shadow' );
		}

		const stylePropertyMap = STYLE_PROPERTY as Record<
			string,
			{
				support?: string[];
				requiresOptOut?: boolean;
				value?: string[];
			}
		>;

		Object.keys( stylePropertyMap ).forEach( ( styleName ) => {
			if ( ! stylePropertyMap[ styleName ].support ) {
				return;
			}

			// Opting out means that, for certain support keys like background color,
			// blocks have to explicitly set the support value false. If the key is
			// unset, we still enable it.
			if ( stylePropertyMap[ styleName ].requiresOptOut ) {
				if (
					supports &&
					stylePropertyMap[ styleName ].support![ 0 ] in supports &&
					getValueFromObjectPath(
						supports,
						stylePropertyMap[ styleName ].support!
					) !== false
				) {
					supportKeys.push( styleName );
					return;
				}
			}

			if (
				supports &&
				getValueFromObjectPath(
					supports,
					stylePropertyMap[ styleName ].support!,
					false
				)
			) {
				supportKeys.push( styleName );
			}
		} );

		return filterElementBlockSupports( supportKeys, name, element );
	},
	( state: BlockStoreState, name: string | undefined ) => [
		state.blockTypes[ name as string ],
	]
);

/**
 * Returns the bootstrapped block type metadata for a give block name.
 *
 * @param state Data state.
 * @param name  Block name.
 *
 * @return Bootstrapped block type metadata for a block.
 */
export function getBootstrappedBlockType(
	state: BlockStoreState,
	name: string
): Partial< BlockType > | undefined {
	return state.bootstrappedBlockTypes[ name ];
}

/**
 * Returns all the unprocessed (before applying the `registerBlockType` filter)
 * block type settings as passed during block registration.
 *
 * @param state Data state.
 *
 * @return Unprocessed block type settings for all blocks.
 */
export function getUnprocessedBlockTypes(
	state: BlockStoreState
): Record< string, Partial< BlockType > > {
	return state.unprocessedBlockTypes;
}

/**
 * Returns all the block bindings sources registered.
 *
 * @param state Data state.
 *
 * @return All the registered sources and their properties.
 */
export function getAllBlockBindingsSources(
	state: BlockStoreState
): Record< string, Omit< BlockBindingsSource, 'name' > > {
	return state.blockBindingsSources;
}

/**
 * Returns a specific block bindings source.
 *
 * @param state      Data state.
 * @param sourceName Name of the source to get.
 *
 * @return The specific block binding source and its properties.
 */
export function getBlockBindingsSource(
	state: BlockStoreState,
	sourceName: string
): Omit< BlockBindingsSource, 'name' > | undefined {
	return state.blockBindingsSources[ sourceName ];
}

/**
 * Compute the fields list for a specific block bindings source.
 *
 * @param state        Data state.
 * @param source       Block bindings source.
 * @param blockContext Block context.
 *
 * @return List of fields for the specific source.
 */
export const getBlockBindingsSourceFieldsList = createRegistrySelector(
	( select: unknown ) =>
		createSelector(
			(
				state: BlockStoreState,
				source: BlockBindingsSource,
				blockContext: Record< string, unknown >
			): unknown[] => {
				if ( ! source.getFieldsList ) {
					return [];
				}

				const context: Record< string, unknown > = {};
				if ( source?.usesContext?.length ) {
					for ( const key of source.usesContext ) {
						context[ key ] = blockContext[ key ];
					}
				}
				return source.getFieldsList( { select, context } ) as unknown[];
			},
			(
				state: BlockStoreState,
				source: BlockBindingsSource,
				blockContext: Record< string, unknown >
			) => [ source.getFieldsList, source.usesContext, blockContext ]
		)
);

/**
 * Determines if any of the block type's attributes have
 * the content role attribute.
 *
 * @param state         Data state.
 * @param blockTypeName Block type name.
 * @return Whether block type has content role attribute.
 */
export const hasContentRoleAttribute = (
	state: BlockStoreState,
	blockTypeName: string
): boolean => {
	const blockType = getBlockType( state, blockTypeName );
	if ( ! blockType ) {
		return false;
	}

	return Object.values( blockType.attributes ).some(
		( { role, __experimentalRole }: BlockAttribute ) => {
			if ( role === 'content' ) {
				return true;
			}
			if ( __experimentalRole === 'content' ) {
				deprecated( '__experimentalRole attribute', {
					since: '6.7',
					version: '6.8',
					alternative: 'role attribute',
					hint: `Check the block.json of the ${ blockTypeName } block.`,
				} );
				return true;
			}
			return false;
		}
	);
};
