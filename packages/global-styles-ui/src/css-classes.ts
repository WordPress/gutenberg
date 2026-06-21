/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import {
	normalizeCSSClassName,
	type CSSClassDefinition,
} from '@wordpress/global-styles-engine';

export interface CSSClassUsage {
	clientId?: string;
	className: string;
	blockName: string;
	blockTitle: string;
	blockPath?: number[];
	entityId?: string;
	entityType?: string;
	entityLabel?: string;
	entityTitle?: string;
	status?: string;
	source?: string;
}

export interface CSSClassUsageData {
	usages: CSSClassUsage[];
	counts: Record< string, number >;
	classNames: string[];
}

export interface BlockLike {
	clientId?: string;
	name?: string;
	attributes?: {
		className?: string;
	};
	innerBlocks?: BlockLike[];
}

function getBlockClassNames( block: BlockLike ): string[] {
	const className = block.attributes?.className;
	if ( typeof className !== 'string' ) {
		return [];
	}
	return className.split( /\s+/ ).filter( Boolean );
}

function getBlockTitle( blockName: string ): string {
	return getBlockType( blockName )?.title || blockName;
}

/**
 * Returns usages of a managed CSS class in a block tree.
 *
 * @param blocks    Blocks to inspect.
 * @param className Class name to count.
 * @return Matching block usages.
 */
export function getCSSClassUsages(
	blocks: BlockLike[] = [],
	className: string
): CSSClassUsage[] {
	const normalizedClassName = normalizeCSSClassName( className );
	const usages: CSSClassUsage[] = [];
	const seenClientIds = new Set< string >();

	function visit( block: BlockLike ) {
		if (
			block.clientId &&
			block.name &&
			getBlockClassNames( block ).includes( normalizedClassName ) &&
			! seenClientIds.has( block.clientId )
		) {
			seenClientIds.add( block.clientId );
			usages.push( {
				clientId: block.clientId,
				className: normalizedClassName,
				blockName: block.name,
				blockTitle: getBlockTitle( block.name ),
				source: 'canvas',
			} );
		}

		block.innerBlocks?.forEach( visit );
	}

	blocks.forEach( visit );
	return usages;
}

/**
 * Returns usage counts keyed by managed class name.
 *
 * @param blocks     Blocks to inspect.
 * @param cssClasses Managed CSS class definitions.
 * @return Usage counts keyed by class name.
 */
export function getCSSClassUsageCounts(
	blocks: BlockLike[] = [],
	cssClasses: CSSClassDefinition[] = []
): Record< string, number > {
	return cssClasses.reduce< Record< string, number > >( ( counts, item ) => {
		const className = normalizeCSSClassName( item.name );
		counts[ className ] = getCSSClassUsages( blocks, className ).length;
		return counts;
	}, {} );
}
