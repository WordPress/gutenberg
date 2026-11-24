import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { applyFilters } from '@wordpress/hooks';
import { useHideBlocksFromInserter } from '../use-hide-blocks-from-inserter';

/*
 * The blocks of a template: a group, and a template part and a synced pattern
 * that each hold a group of what they render.
 */
const BLOCKS: Record< string, { name: string; parents: string[] } > = {
	group: { name: 'core/group', parents: [] },
	templatePart: { name: 'core/template-part', parents: [] },
	groupInTemplatePart: { name: 'core/group', parents: [ 'templatePart' ] },
	syncedPattern: { name: 'core/block', parents: [] },
	groupInSyncedPattern: { name: 'core/group', parents: [ 'syncedPattern' ] },
};

// The selectors the block editor hands the filter.
const selectors = {
	getBlock: ( clientId: string ) => BLOCKS[ clientId ],
	getBlockParentsByBlockName: (
		clientId: string,
		blockNames: string | string[]
	) =>
		BLOCKS[ clientId ].parents.filter( ( parentClientId ) =>
			[ blockNames ].flat().includes( BLOCKS[ parentClientId ].name )
		),
};

/**
 * Returns whether the block editor is left to insert the template slot block.
 *
 * @param postType     The post type being edited.
 * @param rootClientId The block to insert it in, or none for the top level.
 * @param canInsert    Whether the block editor would insert it there.
 */
function canInsertTemplateSlot(
	postType: string,
	rootClientId?: string,
	canInsert = true
) {
	const { unmount } = renderHook( () =>
		useHideBlocksFromInserter( postType, 'post-only' )
	);
	const filtered = applyFilters(
		'blockEditor.__unstableCanInsertBlockType',
		canInsert,
		{ name: 'core/template-slot' },
		rootClientId,
		selectors
	);
	unmount();
	return filtered;
}

describe( 'useHideBlocksFromInserter', () => {
	describe( 'the template slot block', () => {
		it.each( [ undefined, 'group' ] )(
			'is offered among the blocks of a template, in %s',
			( rootClientId ) => {
				expect(
					canInsertTemplateSlot( 'wp_template', rootClientId )
				).toBe( true );
			}
		);

		// The slot is looked for among the blocks of the template alone, so
		// one in a template part or a synced pattern would not be the slot.
		it.each( [
			'templatePart',
			'groupInTemplatePart',
			'syncedPattern',
			'groupInSyncedPattern',
		] )(
			'is not offered in what a template holds of something else, in %s',
			( rootClientId ) => {
				expect(
					canInsertTemplateSlot( 'wp_template', rootClientId )
				).toBe( false );
			}
		);

		it.each( [ 'post', 'page', 'wp_block', 'wp_template_part' ] )(
			'is not offered for a %s',
			( postType ) => {
				expect( canInsertTemplateSlot( postType ) ).toBe( false );
				expect( canInsertTemplateSlot( postType, 'group' ) ).toBe(
					false
				);
			}
		);

		it( 'is not offered where the block editor does not insert it', () => {
			expect(
				canInsertTemplateSlot( 'wp_template', undefined, false )
			).toBe( false );
		} );
	} );

	it( 'leaves the other blocks of a template to the block editor', () => {
		const { unmount } = renderHook( () =>
			useHideBlocksFromInserter( 'wp_template', 'post-only' )
		);
		expect(
			applyFilters(
				'blockEditor.__unstableCanInsertBlockType',
				true,
				{ name: 'core/paragraph' },
				'groupInTemplatePart',
				selectors
			)
		).toBe( true );
		unmount();
	} );
} );
