/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';

/**
 * Renders the block's configured title as a string, or empty if the title
 * cannot be determined.
 *
 * @example
 *
 * ```jsx
 * <BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" />
 * ```
 *
 * @param {Object}  props
 * @param {?string} props.name Block name.
 *
 * @return {?string} Block title.
 */
export function BlockTitle( { name } ) {
	if ( ! name ) {
		return null;
	}

	const blockType = getBlockType( name );
	if ( ! blockType ) {
		return null;
	}

	// TODO: Infer this from `block.json` when we have block context.
	// See https://github.com/WordPress/gutenberg/issues/19685.
	if ( name === 'core/template-part' ) {
		return (
			<>
				<span className="block-editor-block-title__global">
					Global{ ' ' }
				</span>
				{ blockType.title }
			</>
		);
	}

	return blockType.title;
}

export default withSelect( ( select, ownProps ) => {
	const { getBlockName } = select( 'core/block-editor' );
	const { clientId } = ownProps;

	return {
		name: getBlockName( clientId ),
	};
} )( BlockTitle );
