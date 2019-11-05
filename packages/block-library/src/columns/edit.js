/**
 * External dependencies
 */
import classnames from 'classnames';
import { dropRight, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
} from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
import { withDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getColumnsTemplate,
	hasExplicitColumnWidths,
	getMappedColumnWidths,
	getRedistributedColumnWidths,
	toWidthPrecision,
} from './utils';

/**
 * Allowed blocks constant is passed to InnerBlocks precisely as specified here.
 * The contents of the array should never change.
 * The array should contain the name of each block that is allowed.
 * In columns block, the only block we allow is 'core/column'.
 *
 * @constant
 * @type {string[]}
 */
const ALLOWED_BLOCKS = [ 'core/column' ];

export function ColumnsEdit( {
	attributes,
	className,
	updateAlignment,
	updateColumns,
	clientId,
} ) {
	const { verticalAlignment } = attributes;

	const { count, patterns } = useSelect( ( select ) => {
		return {
			count: select( 'core/block-editor' ).getBlockCount( clientId ),
			patterns: select( 'core/blocks' ).__experimentalGetBlockPatterns( 'core/columns' ),
		};
	} );
	const [ template, setTemplate ] = useState( getColumnsTemplate( count ) );
	const [ forceUseTemplate, setForceUseTemplate ] = useState( false );

	// This is used to force the usage of the template even if the count doesn't match the template
	// The count doesn't match the template once you use undo/redo (this is used to reset to the placeholder state).
	useEffect( () => {
		// Once the template is applied, reset it.
		if ( forceUseTemplate ) {
			setForceUseTemplate( false );
		}
	}, [ forceUseTemplate ] );

	const classes = classnames( className, {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	// The template selector is shown when we first insert the columns block (count === 0).
	// or if there's no template available.
	// The count === 0 trick is useful when you use undo/redo.
	const showTemplateSelector = ( count === 0 && ! forceUseTemplate ) || ! template;

	return (
		<>
			{ ! showTemplateSelector && (
				<>
					<InspectorControls>
						<PanelBody>
							<RangeControl
								label={ __( 'Columns' ) }
								value={ count }
								onChange={ ( value ) => updateColumns( count, value ) }
								min={ 2 }
								max={ 6 }
							/>
						</PanelBody>
					</InspectorControls>
					<BlockControls>
						<BlockVerticalAlignmentToolbar
							onChange={ updateAlignment }
							value={ verticalAlignment }
						/>
					</BlockControls>
				</>
			) }
			<div className={ classes }>
				<InnerBlocks
					__experimentalTemplateOptions={ patterns }
					__experimentalOnSelectTemplateOption={ ( nextTemplate ) => {
						if ( nextTemplate === undefined ) {
							nextTemplate = getColumnsTemplate( 2 );
						}

						setTemplate( nextTemplate );
						setForceUseTemplate( true );
					} }
					__experimentalAllowTemplateOptionSkip
					template={ showTemplateSelector ? null : template }
					templateLock="all"
					allowedBlocks={ ALLOWED_BLOCKS } />
			</div>
		</>
	);
}

export default withDispatch( ( dispatch, ownProps, registry ) => ( {
	/**
	 * Update all child Column blocks with a new vertical alignment setting
	 * based on whatever alignment is passed in. This allows change to parent
	 * to overide anything set on a individual column basis.
	 *
	 * @param {string} verticalAlignment the vertical alignment setting
	 */
	updateAlignment( verticalAlignment ) {
		const { clientId, setAttributes } = ownProps;
		const { updateBlockAttributes } = dispatch( 'core/block-editor' );
		const { getBlockOrder } = registry.select( 'core/block-editor' );

		// Update own alignment.
		setAttributes( { verticalAlignment } );

		// Update all child Column Blocks to match
		const innerBlockClientIds = getBlockOrder( clientId );
		innerBlockClientIds.forEach( ( innerBlockClientId ) => {
			updateBlockAttributes( innerBlockClientId, {
				verticalAlignment,
			} );
		} );
	},

	/**
	 * Updates the column count, including necessary revisions to child Column
	 * blocks to grant required or redistribute available space.
	 *
	 * @param {number} previousColumns Previous column count.
	 * @param {number} newColumns      New column count.
	 */
	updateColumns( previousColumns, newColumns ) {
		const { clientId } = ownProps;
		const { replaceInnerBlocks } = dispatch( 'core/block-editor' );
		const { getBlocks } = registry.select( 'core/block-editor' );

		let innerBlocks = getBlocks( clientId );
		const hasExplicitWidths = hasExplicitColumnWidths( innerBlocks );

		// Redistribute available width for existing inner blocks.
		const isAddingColumn = newColumns > previousColumns;

		if ( isAddingColumn && hasExplicitWidths ) {
			// If adding a new column, assign width to the new column equal to
			// as if it were `1 / columns` of the total available space.
			const newColumnWidth = toWidthPrecision( 100 / newColumns );

			// Redistribute in consideration of pending block insertion as
			// constraining the available working width.
			const widths = getRedistributedColumnWidths( innerBlocks, 100 - newColumnWidth );

			innerBlocks = [
				...getMappedColumnWidths( innerBlocks, widths ),
				...times( newColumns - previousColumns, () => {
					return createBlock( 'core/column', {
						width: newColumnWidth,
					} );
				} ),
			];
		} else if ( isAddingColumn ) {
			innerBlocks = [
				...innerBlocks,
				...times( newColumns - previousColumns, () => {
					return createBlock( 'core/column' );
				} ),
			];
		} else {
			// The removed column will be the last of the inner blocks.
			innerBlocks = dropRight( innerBlocks, previousColumns - newColumns );

			if ( hasExplicitWidths ) {
				// Redistribute as if block is already removed.
				const widths = getRedistributedColumnWidths( innerBlocks, 100 );

				innerBlocks = getMappedColumnWidths( innerBlocks, widths );
			}
		}

		replaceInnerBlocks( clientId, innerBlocks, false );
	},
} ) )( ColumnsEdit );
