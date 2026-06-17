/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, dispatch } from '@wordpress/data';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import {
	store as blocksStore,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '@wordpress/routes-lock-unlock';
import type {
	Scope,
	GuidelineRow,
	ContentBlock,
	GuidelineQuery,
} from './types';

const { isContentBlock } = unlock( blocksPrivateApis );

export const KNOWLEDGE_KIND = 'postType';
export const KNOWLEDGE_NAME = 'wp_knowledge';

const SCOPE_PREFIX = 'guideline-';
const BLOCK_PREFIX = 'guideline-block-';

// Sentinel slug used while the registry/block list is still empty so the
// collection query matches nothing instead of every knowledge row.
const NO_MATCH_SLUG = 'guideline-__none__';

/**
 * The slug for a registry scope row, e.g. `guideline-copy`.
 * @param scope Scope key.
 */
export function scopeSlug( scope: string ): string {
	return `${ SCOPE_PREFIX }${ scope }`;
}

/**
 * The slug for a block guideline row, e.g. `guideline-block-core-paragraph`.
 * Forward-only and unambiguous; the canonical block name lives in the title.
 * @param blockName Exact block name (e.g. `core/paragraph`).
 */
export function blockSlug( blockName: string ): string {
	return `${ BLOCK_PREFIX }${ blockName.replace( '/', '-' ) }`;
}

/**
 * The content-role blocks from the client block registry — the authoritative
 * list of blocks that can carry guidelines.
 */
export function useContentBlocks(): ContentBlock[] {
	return useSelect(
		( s ) =>
			// @ts-ignore - getBlockTypes is untyped in this context.
			s( blocksStore )
				.getBlockTypes()
				.filter( ( block: ContentBlock ) =>
					isContentBlock( block.name )
				),
		[]
	);
}

interface GuidelineData {
	scopes: Scope[];
	contentBlocks: ContentBlock[];
	bySlug: Record< string, GuidelineRow >;
	query: GuidelineQuery;
	isLoading: boolean;
}

/**
 * Reads the guideline scope registry and the per-scope/per-block rows in one
 * slug-filtered collection request, indexed by slug.
 */
export function useGuidelineData(): GuidelineData {
	const { records: scopeRecords, isResolving: scopesResolving } =
		useEntityRecords( 'root', 'guidelineScope' );

	const contentBlocks = useContentBlocks();

	const scopes: Scope[] = useMemo(
		() =>
			( ( scopeRecords as Scope[] ) ?? [] )
				.map( ( s ) => ( {
					slug: s.slug,
					title: s.title,
					description: s.description,
					order: s.order ?? 0,
				} ) )
				.sort( ( a, b ) => a.order - b.order ),
		[ scopeRecords ]
	);

	const slugs = useMemo( () => {
		const list = [
			...scopes.map( ( s ) => scopeSlug( s.slug ) ),
			...contentBlocks.map( ( b ) => blockSlug( b.name ) ),
		];
		return list.length > 0 ? list : [ NO_MATCH_SLUG ];
	}, [ scopes, contentBlocks ] );

	const query: GuidelineQuery = useMemo(
		() => ( {
			slug: slugs,
			status: [ 'publish', 'draft' ],
			context: 'edit',
			per_page: -1,
		} ),
		[ slugs ]
	);

	const { records: rowRecords, isResolving: rowsResolving } =
		useEntityRecords( KNOWLEDGE_KIND, KNOWLEDGE_NAME, query );

	const bySlug = useMemo( () => {
		const map: Record< string, GuidelineRow > = {};
		for ( const row of rowRecords ?? [] ) {
			map[ row.slug ] = {
				id: row.id,
				content: row.content?.raw ?? '',
			};
		}
		return map;
	}, [ rowRecords ] );

	return {
		scopes,
		contentBlocks,
		bySlug,
		query,
		isLoading: scopesResolving || rowsResolving,
	};
}

/**
 * Creates (or updates) a guideline row for the given slug.
 *
 * The server forces the `guideline` term and, for registry scopes, re-stamps
 * the title; block rows keep the canonical block name passed as the title.
 *
 * @param slug       Row slug.
 * @param title      Title to send (registry title for scopes, exact block name for blocks).
 * @param content    Guideline text.
 * @param existingId Existing row id, or undefined to create.
 * @param query      The collection query to invalidate after a create.
 */
export async function saveGuidelineRow(
	slug: string,
	title: string,
	content: string,
	existingId: number | undefined,
	query: GuidelineQuery
): Promise< void > {
	const {
		editEntityRecord,
		saveEditedEntityRecord,
		saveEntityRecord,
		invalidateResolution,
	} = dispatch( coreStore );

	if ( existingId ) {
		await editEntityRecord( KNOWLEDGE_KIND, KNOWLEDGE_NAME, existingId, {
			content,
		} );
		await saveEditedEntityRecord(
			KNOWLEDGE_KIND,
			KNOWLEDGE_NAME,
			existingId,
			undefined,
			{ throwOnError: true }
		);
		return;
	}

	await saveEntityRecord(
		KNOWLEDGE_KIND,
		KNOWLEDGE_NAME,
		{ slug, title, content, status: 'publish' },
		{ throwOnError: true }
	);

	// A freshly created row's id isn't in the slug-filtered query's resolved id
	// list yet; re-resolve so it shows up.
	invalidateResolution( 'getEntityRecords', [
		KNOWLEDGE_KIND,
		KNOWLEDGE_NAME,
		query,
	] );
}

/**
 * Deletes a guideline row (force, so no empty rows linger and the slug frees up).
 * @param id Row id.
 */
export async function deleteGuidelineRow( id: number ): Promise< void > {
	await dispatch( coreStore ).deleteEntityRecord(
		KNOWLEDGE_KIND,
		KNOWLEDGE_NAME,
		id,
		{ force: true },
		{ throwOnError: true }
	);
}
