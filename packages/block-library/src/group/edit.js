/**
 * External dependencies
 */
import { partialRight } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	InnerBlocks,
	__experimentalUseColors,
	InspectorControls,
} from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';

import {
	PanelBody,
	__experimentalDimensionControl as DimensionControl,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';

function GroupEdit( { hasInnerBlocks, className, attributes, setAttributes } ) {
	const ref = useRef();
	const {
		TextColor,
		BackgroundColor,
		InspectorControlsColorPanel,
	} = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'has-background' },
		],
		{
			contrastCheckers: [ { backgroundColor: true, textColor: true } ],
			colorDetector: { targetRef: ref },
		}
	);

	/**
	 * Updates the spacing attribute for a given dimension
	 * (and optionally a given viewport)
	 *
	 * @param  {string} size      a slug representing a dimension size (eg: `medium`)
	 * @param  {string} dimensionAttr the dimension attribute for a property (eg: `paddingSize`)
	 * @return {void}
	 */
	const updateSpacing = ( size, dimensionAttr ) => {
		setAttributes( {
			[ dimensionAttr ]: size,
		} );
	};

	const hasPadding = !! attributes.paddingSize;
	const hasMargin = !! attributes.marginSize;

	const classes = classnames( className, {
		'has-padding': hasPadding,
		'has-margin': hasMargin,
		[ `padding-${ attributes.paddingSize }` ]: hasPadding,
		[ `margin-${ attributes.marginSize }` ]: hasMargin,
	} );

	return (
		<>
			{ InspectorControlsColorPanel }
			<InspectorControls>
				<PanelBody title={ __( 'Spacing' ) }>
					<DimensionControl
						label={ __( 'Padding' ) }
						value={ attributes.paddingSize }
						onChange={ partialRight(
							updateSpacing,
							'paddingSize'
						) }
						help={ __(
							'Adjust spacing around content within the block.'
						) }
					/>

					<DimensionControl
						label={ __( 'Margin' ) }
						value={ attributes.marginSize }
						onChange={ partialRight( updateSpacing, 'marginSize' ) }
						help={ __(
							'Adjust spacing on the sides of the block.'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<BackgroundColor>
				<TextColor>
					<div className={ classes } ref={ ref }>
						<div className="wp-block-group__inner-container">
							<InnerBlocks
								renderAppender={
									! hasInnerBlocks &&
									InnerBlocks.ButtonBlockAppender
								}
							/>
						</div>
					</div>
				</TextColor>
			</BackgroundColor>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock } = select( 'core/block-editor' );

		const block = getBlock( clientId );

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
		};
	} ),
] )( GroupEdit );
