import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * A single lint finding, shaped so the Notes tray can carry it in the same
 * list as note threads.
 */
export interface LintItem {
	/**
	 * Discriminates lint findings from note threads.
	 */
	kind: 'lint';

	/**
	 * Stable identifier, derived from the rule and the block.
	 */
	id: string;

	/**
	 * The block the finding is about.
	 */
	blockClientId: string;

	/**
	 * The rule that produced the finding.
	 */
	ruleId: string;

	severity: 'info';

	/**
	 * The user-facing text of the finding.
	 */
	body: string;
}

/**
 * The block attributes a rule reads. Attributes are per block type, so each
 * rule narrows what it needs itself.
 */
interface LintableAttributes {
	metadata?: {
		blockVisibility?: unknown;
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
}

interface LintRule {
	id: string;
	severity: LintItem[ 'severity' ];
	match: ( attributes: LintableAttributes | null ) => boolean;
	body: () => string;
}

const RULES: LintRule[] = [
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
 * @return Items tagged with `kind: 'lint'`.
 */
export function useLintItems(): LintItem[] {
	const blocks = useSelect( ( select ) => {
		const { getClientIdsWithDescendants, getBlockAttributes } =
			select( blockEditorStore );
		return getClientIdsWithDescendants().map( ( clientId ) => ( {
			clientId,
			attributes: getBlockAttributes(
				clientId
			) as LintableAttributes | null,
		} ) );
	}, [] );

	return useMemo( () => {
		const items: LintItem[] = [];
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
