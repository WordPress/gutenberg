/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import withDeprecatedUniqueId from '../with-deprecated-unique-id';

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

	return blockType.title;
}

export default compose( [
	withDeprecatedUniqueId,
	withSelect( ( select, ownProps ) => {
		const { getBlockName } = select( 'core/editor' );
		const { clientId } = ownProps;

		return {
			name: getBlockName( clientId ),
		};
	} ),
] )( BlockTitle );
