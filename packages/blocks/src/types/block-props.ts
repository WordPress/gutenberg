/**
 * Internal dependencies
 */
import type { BlockType } from './block-type';

/**
 * Describes the `save` component props of a {@link BlockType}.
 *
 * @see {@link BlockType.save}
 * @public
 */
export interface BlockSaveProps< Attributes extends Record< string, any > > {
	className: string;
	attributes: Attributes;
}

/**
 * Describes the `edit` component props of a {@link BlockType}.
 *
 * @see {@link BlockType.edit}
 * @public
 */
export interface BlockEditProps< Attributes extends Record< string, any > >
	extends BlockSaveProps< Attributes > {
	clientId: string;
	isSelected: boolean;
	setAttributes: ( attrs: Partial< Attributes > ) => void;
	context: Record< string, any >;
}
