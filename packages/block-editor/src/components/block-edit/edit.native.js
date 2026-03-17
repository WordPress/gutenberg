/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockContext from '../block-context';

/**
 * Default value used for blocks which do not define their own context needs,
 * used to guarantee that a block's `context` prop will always be an object. It
 * is assigned as a constant since it is always expected to be an empty object,
 * and in order to avoid unnecessary React reconciliations of a changing object.
 *
 * @type {{}}
 */
const DEFAULT_BLOCK_CONTEXT = {};

export const Edit = ( props ) => {
	const { name } = props;
	const blockType = getBlockType( name );

	const blockContext = useContext( BlockContext );

	// Assign context values using the block type's declared context needs.
	const context = useMemo( () => {
		return blockType && blockType.usesContext
			? Object.fromEntries(
					Object.entries( blockContext ).filter( ( [ key ] ) =>
						blockType.usesContext.includes( key )
					)
			  )
			: DEFAULT_BLOCK_CONTEXT;
	}, [ blockType, blockContext ] );

	if ( ! blockType ) {
		return null;
	}

	const Component = blockType.edit;

	return <Component { ...props } context={ context } />;
};

export default withFilters( 'editor.BlockEdit' )( Edit );
