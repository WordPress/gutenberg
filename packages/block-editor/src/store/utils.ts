import type { Block } from '@wordpress/blocks';
import { parse } from '@wordpress/blocks';
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';
import type { select as globalSelect } from '@wordpress/data';
import {
	selectBlockPatternsKey,
	userPatternCategoriesSelectKey,
	currentUserIdSelectKey,
} from './private-keys';
import { unlock } from '../lock-unlock';
import { STORE_NAME } from './constants';
import {
	getSectionRootClientId,
	isSectionBlock,
	getParentSectionBlock,
} from './private-selectors';
import { getBlockEditingMode, getBlockRootClientId } from './selectors';
import { INSERTER_PATTERN_TYPES } from '../components/inserter/block-patterns-tab/utils';
import type {
	BlockAttributes,
	BlockPattern,
	ParsedBlockPattern,
	State,
	UserPattern,
	UserPatternCategory,
} from './types';

type GrammarBlock = ReturnType< typeof grammarParse >[ number ];

export const isFiltered = Symbol( 'isFiltered' );
const parsedPatternCache = new WeakMap< BlockPattern, ParsedBlockPattern >();
const grammarMapCache = new WeakMap< BlockPattern, GrammarBlock[] >();

/**
 * Maps a `wp_block` record to the pattern shape the inserter uses.
 *
 * @param userPattern                         The `wp_block` record.
 * @param __experimentalUserPatternCategories The user pattern categories.
 * @param currentUserId                       The ID of the current user, if known.
 *
 * @return The pattern.
 */
export function mapUserPattern(
	userPattern: UserPattern,
	__experimentalUserPatternCategories: UserPatternCategory[] = [],
	currentUserId?: number
): BlockPattern {
	return {
		name: `core/block/${ userPattern.id }`,
		id: userPattern.id,
		type: INSERTER_PATTERN_TYPES.user,
		title: userPattern.title?.raw,
		categories: userPattern.wp_pattern_category?.map( ( catId ) => {
			const category = __experimentalUserPatternCategories.find(
				( { id } ) => id === catId
			);
			return category ? category.slug : catId;
		} ),
		content: userPattern.content?.raw,
		syncStatus: userPattern.wp_pattern_sync_status,
		isCurrentUserPattern:
			!! currentUserId && userPattern.author === currentUserId,
	};
}

function parsePattern( pattern: BlockPattern ): ParsedBlockPattern {
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
				name:
					( blocks[ 0 ].attributes as BlockAttributes ).metadata
						?.name || pattern.title,
			},
		};
	}
	return {
		...pattern,
		blocks,
	};
}

export function getParsedPattern( pattern: BlockPattern ) {
	let parsedPattern = parsedPatternCache.get( pattern );
	if ( ! parsedPattern ) {
		parsedPattern = parsePattern( pattern );
		parsedPatternCache.set( pattern, parsedPattern );
	}
	return parsedPattern;
}

export function getGrammar( pattern: BlockPattern ): GrammarBlock[] {
	let grammarMap = grammarMapCache.get( pattern );
	if ( ! grammarMap ) {
		grammarMap = grammarParse( pattern.content );
		// Block names are null only at the top level for whitespace.
		grammarMap = grammarMap.filter( ( block ) => block.blockName !== null );
		grammarMapCache.set( pattern, grammarMap );
	}
	return grammarMap;
}

export const checkAllowList = (
	list: unknown,
	item: string | null | undefined,
	defaultResult: boolean | null = null
) => {
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

export const checkAllowListRecursive = (
	blocks: Array< Block | GrammarBlock >,
	allowedBlockTypes: unknown
) => {
	if ( typeof allowedBlockTypes === 'boolean' ) {
		return allowedBlockTypes;
	}

	const blocksQueue = [ ...blocks ];
	while ( blocksQueue.length > 0 ) {
		const block = blocksQueue.shift()!;

		const isAllowed = checkAllowList(
			allowedBlockTypes,
			( block as Block ).name || ( block as GrammarBlock ).blockName,
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

export const getAllPatternsDependants =
	( select: typeof globalSelect ) => ( state: State ) => {
		return [
			state.settings.__experimentalBlockPatterns,
			state.settings[ userPatternCategoriesSelectKey ]?.( select ) ??
				state.settings.__experimentalUserPatternCategories,
			state.settings.__experimentalReusableBlocks,
			state.settings[ selectBlockPatternsKey ]?.( select ),
			state.settings[ currentUserIdSelectKey ]?.( select ),
			// @ts-expect-error The store has no `blockPatterns`, so this is always undefined.
			state.blockPatterns,
			unlock( select( STORE_NAME ) ).getReusableBlocks(),
		];
	};

// Callers pass `select`, which the dependants do not need.
export const getInsertBlockTypeDependants: (
	select?: typeof globalSelect
) => ( state: State, rootClientId?: string | null ) => unknown[] =
	() => ( state: State, rootClientId?: string | null ) => {
		return [
			state.blockListSettings.get( rootClientId! ),
			state.blocks.byClientId.get( rootClientId! ),
			state.blocks.order.get( rootClientId || '' ),
			state.settings.allowedBlockTypes,
			state.settings.templateLock,
			getBlockEditingMode( state, rootClientId! ),
			getSectionRootClientId( state ),
			isSectionBlock( state, rootClientId! ),
			getParentSectionBlock( state, rootClientId! ),
		];
	};

/**
 * Returns the containers above the root that a block can be inserted into
 * instead, closest first: the section root for the top level, otherwise the
 * ancestors.
 *
 * @param state        Editor state.
 * @param rootClientId Root client ID.
 *
 * @return Client IDs of the fallback containers.
 */
export function getFallbackInsertionRoots(
	state: State,
	rootClientId?: string | null
): string[] {
	if ( ! rootClientId ) {
		const sectionRootClientId = getSectionRootClientId( state );
		return sectionRootClientId ? [ sectionRootClientId ] : [];
	}

	const roots: string[] = [];
	let current = getBlockRootClientId( state, rootClientId );
	while ( current !== null ) {
		roots.push( current );
		current = getBlockRootClientId( state, current );
	}
	return roots;
}
