/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { getBlockValidAlignments } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { BlockControls, BlockAlignmentToolbar } from '../components';

/**
 * Override the default edit UI to include new toolbar controls for block
 * alignment, if block defines support.
 *
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
export const withToolbarControls = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const validAlignments = getBlockValidAlignments( props.name );

		const updateAlignment = ( nextAlign ) => props.setAttributes( { align: nextAlign } );

		return [
			validAlignments.length > 0 && props.isSelected && (
				<BlockControls key="align-controls">
					<BlockAlignmentToolbar
						value={ props.attributes.align }
						onChange={ updateAlignment }
						controls={ validAlignments }
					/>
				</BlockControls>
			),
			<BlockEdit key="edit" { ...props } />,
		];
	};
}, 'withToolbarControls' );

/**
 * Override the default block element to add alignment wrapper props.
 *
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
export const withAlign = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		const { align } = props.block.attributes;
		const validAlignments = getBlockValidAlignments( props.block.name );

		let wrapperProps = props.wrapperProps;
		if ( includes( validAlignments, align ) ) {
			wrapperProps = { ...wrapperProps, 'data-align': align };
		}

		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	};
}, 'withAlign' );

addFilter( 'editor.BlockListBlock', 'core/align/withAlign', withAlign );
addFilter( 'blocks.BlockEdit', 'core/align/withToolbarControls', withToolbarControls );

