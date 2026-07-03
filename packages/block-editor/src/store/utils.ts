/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';
import type { Block } from '@wordpress/blocks';
import type { select as globalSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	selectBlockPatternsKey,
	userPatternCategoriesSelectKey,
} from './private-keys';
import { unlock } from '../lock-unlock';
import { STORE_NAME } from './constants';
import {
	getSectionRootClientId,
	isSectionBlock,
	getParentSectionBlock,
} from './private-selectors';
import { getBlockEditingMode } from './selectors';
import { INSERTER_PATTERN_TYPES } from '../components/inserter/block-patterns-tab/utils';
import type {
	State,
	EditorSettings,
	UserPattern,
	UserPatternCategory,
	Pattern,
	GrammarBlock,
} from './types';

// ─── Pattern types ────────────────────────────────────────────────────────────

export const isFiltered = Symbol( 'isFiltered' );
const parsedPatternCache = new WeakMap();
const grammarMapCache = new WeakMap();

export function mapUserPattern(
	userPattern: UserPattern,
	__experimentalUserPatternCategories: UserPatternCategory[] = []
) {
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
	};
}

function parsePattern( pattern: Pattern ) {
	const blocks = parse( pattern.content ?? '', {
		__unstableSkipMigrationLogs: true,
	} );
	if ( blocks.length === 1 ) {
		blocks[ 0 ].attributes = {
			...blocks[ 0 ].attributes,
			metadata: {
				...( blocks[ 0 ].attributes.metadata || {} ),
				categories: pattern.categories,
				patternName: pattern.name,
				// @ts-ignore - Remove this later
				name: blocks[ 0 ].attributes.metadata?.name || pattern.title,
			},
		};
	}
	return {
		...pattern,
		blocks,
	};
}

export function getParsedPattern(
	pattern: Pattern
): Pattern & { blocks: Block[] } {
	let parsedPattern = parsedPatternCache.get( pattern );
	if ( ! parsedPattern ) {
		parsedPattern = parsePattern( pattern );
		parsedPatternCache.set( pattern, parsedPattern );
	}
	return parsedPattern;
}

export function getGrammar( pattern: Pattern ): GrammarBlock[] {
	let grammarMap = grammarMapCache.get( pattern );
	if ( ! grammarMap ) {
		grammarMap = grammarParse( pattern.content ?? '' );
		// Block names are null only at the top level for whitespace.
		grammarMap = grammarMap.filter(
			( block: GrammarBlock ) => block.blockName !== null
		);
		grammarMapCache.set( pattern, grammarMap );
	}
	return grammarMap;
}

export const checkAllowList = (
	list: string[],
	item: string | null,
	defaultResult: boolean | null = null
): boolean | null => {
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
		return list.includes( item as string );
	}
	return defaultResult;
};

export const checkAllowListRecursive = (
	blocks: Array< GrammarBlock | Block >,
	allowedBlockTypes: EditorSettings[ 'allowedBlockTypes' ]
) => {
	if ( typeof allowedBlockTypes === 'boolean' ) {
		return allowedBlockTypes;
	}

	const blocksQueue = [ ...blocks ];
	while ( blocksQueue.length > 0 ) {
		const block = blocksQueue.shift();

		const isAllowed = checkAllowList(
			allowedBlockTypes as string[],
			( block as Block ).name || ( block as GrammarBlock ).blockName,
			true
		);
		if ( ! isAllowed ) {
			return false;
		}

		( block as Block ).innerBlocks?.forEach( ( innerBlock ) => {
			blocksQueue.push( innerBlock );
		} );
	}

	return true;
};

export const getAllPatternsDependants =
	( select: typeof globalSelect ) =>
	( state: State ): unknown[] => {
		return [
			state.settings.__experimentalBlockPatterns,
			state.settings[ userPatternCategoriesSelectKey ]?.( select ) ??
				state.settings.__experimentalUserPatternCategories,
			state.settings.__experimentalReusableBlocks,
			state.settings[ selectBlockPatternsKey ]?.( select ),
			state.blockPatterns,
			unlock( select( STORE_NAME ) ).getReusableBlocks(),
		];
	};

export const getInsertBlockTypeDependants =
	() =>
	( state: State, rootClientId: string | undefined ): unknown[] => {
		return [
			state.blockListSettings.get( rootClientId ?? '' ),
			state.blocks.byClientId.get( rootClientId ?? '' ),
			state.blocks.order.get( rootClientId ?? '' ),
			state.settings.allowedBlockTypes,
			state.settings.templateLock,
			getBlockEditingMode( state, rootClientId ),
			getSectionRootClientId( state ),
			isSectionBlock( state, rootClientId ?? '' ),
			getParentSectionBlock( state, rootClientId ?? '' ),
		];
	};
