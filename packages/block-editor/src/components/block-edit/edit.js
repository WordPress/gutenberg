/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import {
	getBlockDefaultClassName,
	hasBlockSupport,
	getBlockType,
} from '@wordpress/blocks';
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

const Edit = ( props ) => {
	const { name } = props;
	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return null;
	}

	// `edit` and `save` are functions or components describing the markup
	// with which a block is displayed. If `blockType` is valid, assign
	// them preferentially as the render value for the block.
	const Component = blockType.edit || blockType.save;

	return <Component { ...props } />;
};

const EditWithFilters = withFilters( 'editor.BlockEdit' )( Edit );

const EditWithGeneratedProps = ( props ) => {
	const { attributes = {}, name } = props;
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

	if ( blockType.apiVersion > 1 ) {
		return <EditWithFilters { ...props } context={ context } />;
	}

	// Generate a class name for the block's editable form.
	const generatedClassName = hasBlockSupport( blockType, 'className', true )
		? getBlockDefaultClassName( name )
		: null;
	const className = clsx(
		generatedClassName,
		attributes.className,
		props.className
	);

	return (
		<EditWithFilters
			{ ...props }
			context={ context }
			className={ className }
		/>
	);
};

export default EditWithGeneratedProps;
