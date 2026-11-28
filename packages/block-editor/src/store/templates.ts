import { getBlockType } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import type { BlockEditorThunkArgs, BlockTemplate } from './types';

type TemplateSelectors = Pick<
	BlockEditorThunkArgs[ 'select' ],
	'getBlockListSettings' | 'areInnerBlocksControlled'
>;

/**
 * Resolve whether a block's children belong to the root template. The resolved
 * lock may be temporarily false while editing a content-only ancestor, so keep
 * that ancestor's permanent lock when walking the root template.
 *
 * @param block      Block whose children are being checked.
 * @param select     Block editor selectors.
 * @param parentLock Permanent lock inherited from the parent list.
 * @return The resolved lock and whether the children have their own owner.
 */
function getTemplateBoundary(
	block: Block,
	select: TemplateSelectors,
	parentLock: string | false
) {
	const renderedSettings = select.getBlockListSettings( block.clientId );
	// A controlled reset can reuse a client ID for a different block type,
	// whose edit component might not publish any inner block settings.
	const settings =
		renderedSettings?.blockName !== undefined &&
		renderedSettings.blockName !== block.name
			? undefined
			: renderedSettings;
	const templateLock =
		parentLock === 'contentOnly'
			? parentLock
			: ( settings?.templateLock ?? parentLock );
	const hasOwnTemplate =
		settings?.template !== undefined ||
		getBlockType( block.name )?.template !== undefined;

	return {
		templateLock,
		isBoundary:
			templateLock === false ||
			hasOwnTemplate ||
			select.areInnerBlocksControlled( block.clientId ),
	};
}

/**
 * Match only the block lists owned by the root template. InnerBlocks can own a
 * separate template or explicitly unlock its children after it has rendered.
 *
 * @param blocks     Current blocks.
 * @param template   Root-owned template branch.
 * @param select     Block editor selectors.
 * @param parentLock Permanent lock inherited from the parent list.
 * @return Whether every root-owned list matches its template.
 */
export function doBlocksMatchTemplateWithSettings(
	blocks: Block[],
	template: BlockTemplate | undefined,
	select: TemplateSelectors,
	parentLock: string | false = 'all'
): boolean {
	const expectedBlocks = template ?? [];
	return (
		blocks.length === expectedBlocks.length &&
		expectedBlocks.every( ( [ name, , innerTemplate ], index ) => {
			const block = blocks[ index ];
			if ( block.name !== name ) {
				return false;
			}

			const { isBoundary, templateLock } = getTemplateBoundary(
				block,
				select,
				parentLock
			);
			return (
				isBoundary ||
				doBlocksMatchTemplateWithSettings(
					block.innerBlocks,
					innerTemplate,
					select,
					templateLock
				)
			);
		} )
	);
}

/**
 * Limit root synchronization to the same lists used for root validation.
 * Omitting a nested template preserves that matching block's existing children
 * when synchronizeBlocksWithTemplate applies the resulting template.
 *
 * @param blocks     Current blocks.
 * @param template   Root-owned template branch.
 * @param select     Block editor selectors.
 * @param parentLock Permanent lock inherited from the parent list.
 * @return Template with separately owned child branches omitted.
 */
export function getTemplateForSynchronization(
	blocks: Block[],
	template: BlockTemplate | undefined,
	select: TemplateSelectors,
	parentLock: string | false = 'all'
): BlockTemplate | undefined {
	return template?.map( ( item, index ) => {
		const [ name, attributes, innerTemplate ] = item;
		const block = blocks[ index ];
		if ( ! block || block.name !== name ) {
			return item;
		}

		const { isBoundary, templateLock } = getTemplateBoundary(
			block,
			select,
			parentLock
		);
		if ( isBoundary ) {
			return [ name, attributes ];
		}

		if ( innerTemplate === undefined ) {
			return item;
		}

		return [
			name,
			attributes,
			getTemplateForSynchronization(
				block.innerBlocks,
				innerTemplate,
				select,
				templateLock
			),
		];
	} );
}
