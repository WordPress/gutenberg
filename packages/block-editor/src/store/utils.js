/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';

/**
 * Internal dependencies
 */
import { selectBlockPatternsKey } from './private-keys';
import { unlock } from '../lock-unlock';
import { STORE_NAME } from './constants';

export const withRootClientIdOptionKey = Symbol( 'withRootClientId' );

const parsedPatternCache = new WeakMap();
const grammarMapCache = new WeakMap();

function parsePattern( pattern ) {
	const blocks = parse( pattern.content, {
		__unstableSkipMigrationLogs: true,
	} );
	if ( blocks.length === 1 ) {
		blocks[ 0 ].attributes = {
			...blocks[ 0 ].attributes,
			metadata: {
				...( blocks[ 0 ].attributes.metadata || {} ),
				categories: pattern.categories,
				patternName: pattern.name,
				name: blocks[ 0 ].attributes.metadata?.name || pattern.title,
			},
		};
	}
	return {
		...pattern,
		blocks,
	};
}

export function getParsedPattern( pattern ) {
	let parsedPattern = parsedPatternCache.get( pattern );
	if ( ! parsedPattern ) {
		parsedPattern = parsePattern( pattern );
		parsedPatternCache.set( pattern, parsedPattern );
	}
	return parsedPattern;
}

export function getGrammar( pattern ) {
	let grammarMap = grammarMapCache.get( pattern );
	if ( ! grammarMap ) {
		grammarMap = grammarParse( pattern.content );
		// Block names are null only at the top level for whitespace.
		grammarMap = grammarMap.filter( ( block ) => block.blockName !== null );
		grammarMapCache.set( pattern, grammarMap );
	}
	return grammarMap;
}

export const checkAllowList = ( list, item, defaultResult = null ) => {
	if ( typeof list === 'boolean' ) {
		return list;
	}
	if ( Array.isArray( list ) ) {
		// TODO: when there is a canonical way to detect that we are editing a post
		// the following check should be changed to something like:
		// if ( list.includes( 'core/post-content' ) && getEditorMode() === 'post-content' && item === null )
		if ( list.includes( 'core/post-content' ) && item === null ) {
			return true;
		}
		return list.includes( item );
	}
	return defaultResult;
};

export const checkAllowListRecursive = ( blocks, allowedBlockTypes ) => {
	if ( typeof allowedBlockTypes === 'boolean' ) {
		return allowedBlockTypes;
	}

	const blocksQueue = [ ...blocks ];
	while ( blocksQueue.length > 0 ) {
		const block = blocksQueue.shift();

		const isAllowed = checkAllowList(
			allowedBlockTypes,
			block.name || block.blockName,
			true
		);
		if ( ! isAllowed ) {
			return false;
		}

		block.innerBlocks?.forEach( ( innerBlock ) => {
			blocksQueue.push( innerBlock );
		} );
	}

	return true;
};

export const getAllPatternsDependants = ( select ) => ( state ) => {
	return [
		state.settings.__experimentalBlockPatterns,
		state.settings.__experimentalUserPatternCategories,
		state.settings.__experimentalReusableBlocks,
		state.settings[ selectBlockPatternsKey ]?.( select ),
		state.blockPatterns,
		unlock( select( STORE_NAME ) ).getReusableBlocks(),
	];
};

export function getInsertBlockTypeDependants( state, rootClientId ) {
	return [
		state.blockListSettings[ rootClientId ],
		state.blocks.byClientId.get( rootClientId ),
		state.settings.allowedBlockTypes,
		state.settings.templateLock,
		state.blockEditingModes,
	];
}
