import type { BlockVariation } from '@wordpress/blocks';

/**
 * Props of the controls switching between the transform variations.
 */
export interface VariationsControlProps {
	className: string;
	onSelectVariation: ( variationName: string ) => void;
	selectedValue?: string;
	variations: BlockVariation[];
}

/**
 * Props of `BlockVariationTransforms`.
 */
export interface BlockVariationTransformsProps {
	blockClientId: string;
}
