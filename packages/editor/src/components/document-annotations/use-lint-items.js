/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

const RULES = [
	{
		id: 'hidden-block',
		severity: 'info',
		match: ( attributes ) =>
			attributes?.metadata?.blockVisibility === false,
		body: () => __( 'Hidden block.' ),
	},
];

/**
 * Derives lint items from the current block tree. Each block is run through
 * the rule list; every match emits one canonical item.
 *
 * Items are returned in block-tree order. No persistence: re-running the
 * hook against the same tree is the source of truth.
 *
 * @return {Array} Items tagged with `kind: 'lint'`.
 */
export function useLintItems() {
	const blocks = useSelect( ( select ) => {
		const { getClientIdsWithDescendants, getBlockAttributes } =
			select( blockEditorStore );
		return getClientIdsWithDescendants().map( ( clientId ) => ( {
			clientId,
			attributes: getBlockAttributes( clientId ),
		} ) );
	}, [] );

	return useMemo( () => {
		const items = [];
		for ( const { clientId, attributes } of blocks ) {
			for ( const rule of RULES ) {
				if ( rule.match( attributes ) ) {
					items.push( {
						kind: 'lint',
						id: `lint:${ rule.id }:${ clientId }`,
						blockClientId: clientId,
						ruleId: rule.id,
						severity: rule.severity,
						body: rule.body(),
					} );
				}
			}
		}
		return items;
	}, [ blocks ] );
}
