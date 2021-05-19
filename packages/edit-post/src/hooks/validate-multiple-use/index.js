/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	findTransform,
	getBlockTransforms,
	getBlockType,
	hasBlockSupport,
} from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { Warning, store as blockEditorStore } from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { compose, createHigherOrderComponent } from '@wordpress/compose';

const enhance = compose(
	/**
	 * For blocks whose block type doesn't support `multiple`, provides the
	 * wrapped component with `originalBlockClientId` -- a reference to the
	 * first block of the same type in the content -- if and only if that
	 * "original" block is not the current one. Thus, an inexisting
	 * `originalBlockClientId` prop signals that the block is valid.
	 *
	 * @param {WPComponent} WrappedBlockEdit A filtered BlockEdit instance.
	 *
	 * @return {WPComponent} Enhanced component with merged state data props.
	 */
	withSelect( ( select, block ) => {
		const multiple = hasBlockSupport( block.name, 'multiple', true );

		// For block types with `multiple` support, there is no "original
		// block" to be found in the content, as the block itself is valid.
		if ( multiple ) {
			return {};
		}

		// Otherwise, only pass `originalBlockClientId` if it refers to a different
		// block from the current one.
		const blocks = select( blockEditorStore ).getBlocks();
		const firstOfSameType = find(
			blocks,
			( { name } ) => block.name === name
		);
		const isInvalid =
			firstOfSameType && firstOfSameType.clientId !== block.clientId;
		return {
			originalBlockClientId: isInvalid && firstOfSameType.clientId,
		};
	} ),
	withDispatch( ( dispatch, { originalBlockClientId } ) => ( {
		selectFirst: () =>
			dispatch( blockEditorStore ).selectBlock( originalBlockClientId ),
	} ) )
);

const withMultipleValidation = createHigherOrderComponent( ( BlockEdit ) => {
	return enhance( ( { originalBlockClientId, selectFirst, ...props } ) => {
		if ( ! originalBlockClientId ) {
			return <BlockEdit { ...props } />;
		}

		const blockType = getBlockType( props.name );
		const outboundType = getOutboundType( props.name );

		return [
			<div key="invalid-preview" style={ { minHeight: '60px' } }>
				<BlockEdit key="block-edit" { ...props } />
			</div>,
			<Warning
				key="multiple-use-warning"
				actions={ [
					<Button
						key="find-original"
						isSecondary
						onClick={ selectFirst }
					>
						{ __( 'Find original' ) }
					</Button>,
					<Button
						key="remove"
						isSecondary
						onClick={ () => props.onReplace( [] ) }
					>
						{ __( 'Remove' ) }
					</Button>,
					outboundType && (
						<Button
							key="transform"
							isSecondary
							onClick={ () =>
								props.onReplace(
									createBlock(
										outboundType.name,
										props.attributes
									)
								)
							}
						>
							{ __( 'Transform into:' ) } { outboundType.title }
						</Button>
					),
				] }
			>
				<strong>{ blockType.title }: </strong>
				{ __( 'This block can only be used once.' ) }
			</Warning>,
		];
	} );
}, 'withMultipleValidation' );

/**
 * Given a base block name, returns the default block type to which to offer
 * transforms.
 *
 * @param {string} blockName Base block name.
 *
 * @return {?Object} The chosen default block type.
 */
function getOutboundType( blockName ) {
	// Grab the first outbound transform
	const transform = findTransform(
		getBlockTransforms( 'to', blockName ),
		( { type, blocks } ) => type === 'block' && blocks.length === 1 // What about when .length > 1?
	);

	if ( ! transform ) {
		return null;
	}

	return getBlockType( transform.blocks[ 0 ] );
}

addFilter(
	'editor.BlockEdit',
	'core/edit-post/validate-multiple-use/with-multiple-validation',
	withMultipleValidation
);
