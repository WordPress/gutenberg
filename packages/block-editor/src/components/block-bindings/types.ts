import type { BlockBindingsSource } from '@wordpress/blocks';
import type { Binding } from '../../utils/block-bindings';

/**
 * Contains utils to update the block `bindings` metadata.
 */
export interface BlockBindingsUtils {
	/**
	 * Updates the value of the bindings connected to block attributes.
	 */
	updateBlockBindings: (
		bindings: Record< string, Binding | undefined >
	) => void;
	/**
	 * Removes the bindings property of the `metadata` attribute.
	 */
	removeAllBlockBindings: () => void;
}

/**
 * A field a block bindings source offers to connect to.
 */
export interface BlockBindingsField {
	label?: string;
	type?: string;
	key?: string;
	args?: Record< string, unknown >;
}

/**
 * Props of `BlockBindingsSourceFieldsList`.
 */
export interface BlockBindingsSourceFieldsListProps {
	args?: Record< string, unknown >;
	attribute: string;
	sourceKey: string;
	fields?: BlockBindingsField[];
}

/**
 * Props of an item of `BlockBindingsSourceFieldsList`.
 */
export interface BlockBindingsSourceFieldsListItemProps {
	args?: Record< string, unknown >;
	attribute: string;
	field: BlockBindingsField;
	source: BlockBindingsSource;
	sourceKey: string;
}

/**
 * Props of `BlockBindingsAttributeControl`.
 */
export interface BlockBindingsAttributeControlProps {
	/**
	 * The block attribute name.
	 */
	attribute: string;
	/**
	 * The current block binding.
	 */
	binding?: Binding;
	/**
	 * The block type name.
	 */
	blockName: string;
}
