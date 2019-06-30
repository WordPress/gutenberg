/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import {
	PanelBody,
	RangeControl,
	IconButton,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { Fragment } from '@wordpress/element';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getColumnsTemplate } from './utils';

/**
 * Allowed blocks constant is passed to InnerBlocks precisely as specified here.
 * The contents of the array should never change.
 * The array should contain the name of each block that is allowed.
 * In columns block, the only block we allow is 'core/column'.
 *
 * @constant
 * @type {string[]}
*/
const ALLOWED_BLOCKS = [ 'core/social-link' ];

export const SocialLinksEdit = function( { attributes, setAttributes, className, updateAlignment, addLink } ) {
	const { columns, verticalAlignment } = attributes;

	const classes = classnames( className, `has-${ columns }-columns`, {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const onChange = ( alignment ) => {
		// Update all the (immediate) child Column Blocks
		updateAlignment( alignment );
	};

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody>
					<RangeControl
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ ( nextColumns ) => {
							setAttributes( {
								columns: nextColumns,
							} );
						} }
						min={ 1 }
						max={ 6 }
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ onChange }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<div className={ classes }>
				<InnerBlocks
					template={ getColumnsTemplate( columns ) }
					templateLock={ 'insert' }
					allowedBlocks={ ALLOWED_BLOCKS } />

				<div>
					<IconButton
						isLarge
						label={ __( 'Add link' ) }
						icon="insert"
						onClick={ addLink } >
						{ __( 'Add link' ) }
					</IconButton>
				</div>
			</div>
		</Fragment>
	);
};

const DEFAULT_EMPTY_ARRAY = [];

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { getBlocksByClientId } = select( 'core/block-editor' );
		const [ block ] = getBlocksByClientId( clientId );

		return {
			childLinks: block ? block.innerBlocks : DEFAULT_EMPTY_ARRAY,
		};
	} ),
	withDispatch( ( dispatch, ownProps, registry ) => ( {
		addLink() {
			const { clientId } = ownProps;
			const { replaceInnerBlocks } = dispatch( 'core/block-editor' );
			const { getBlocks } = registry.select( 'core/block-editor' );

			let innerBlocks = getBlocks( clientId );
			innerBlocks = [
				...innerBlocks,
				createBlock( 'core/social-link', { verticalAlignment: 'top' } ),
			];

			replaceInnerBlocks( clientId, innerBlocks, false );
		},
	} )
	),
)( SocialLinksEdit );
