/**
 * External dependencies
 */
import classnames from 'classnames';
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { ToolbarButton, withFilters } from '@wordpress/components';
import {
	getBlockDefaultClassName,
	hasBlockSupport,
	getBlockType,
} from '@wordpress/blocks';
import { useContext, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockContext from '../block-context';
import { store as blockEditorStore } from '../../store';
import BlockControls from '../block-controls';

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
	const { attributes = {}, name, clientId } = props;
	const blockType = getBlockType( name );
	const blockContext = useContext( BlockContext );
	const isEditingBlock = useSelect(
		( select ) => {
			return select( blockEditorStore ).__unstableIsEditingBlock(
				clientId
			);
		},
		[ clientId ]
	);
	const { __unstableStartEditingBlocks: startEditingBlocks } =
		useDispatch( blockEditorStore );
	const showEditBlockButton =
		! isEditingBlock && blockType.supports?.__experimentalBlockOverlay;

	// Assign context values using the block type's declared context needs.
	const context = useMemo( () => {
		return blockType && blockType.usesContext
			? pick( blockContext, blockType.usesContext )
			: DEFAULT_BLOCK_CONTEXT;
	}, [ blockType, blockContext ] );

	if ( ! blockType ) {
		return null;
	}

	// `edit` and `save` are functions or components describing the markup
	// with which a block is displayed. If `blockType` is valid, assign
	// them preferentially as the render value for the block.
	const Component = blockType.edit || blockType.save;
	let blockEdit;
	if ( blockType.apiVersion > 1 ) {
		blockEdit = <Component { ...props } context={ context } />;
	} else {
		// Generate a class name for the block's editable form.
		const generatedClassName = hasBlockSupport(
			blockType,
			'className',
			true
		)
			? getBlockDefaultClassName( name )
			: null;
		const className = classnames(
			generatedClassName,
			attributes.className,
			props.className
		);

		blockEdit = (
			<Component
				{ ...props }
				context={ context }
				className={ className }
			/>
		);
	}

	return (
		<>
			{ blockEdit }
			{ showEditBlockButton && (
				<BlockControls group="block">
					<ToolbarButton
						onClick={ () => startEditingBlocks( clientId ) }
					>
						{ __( 'Edit' ) }
					</ToolbarButton>
				</BlockControls>
			) }
		</>
	);
};

export default withFilters( 'editor.BlockEdit' )( Edit );
