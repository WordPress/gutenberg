/**
 * External dependencies
 */
import { partialRight } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';

import { __ } from '@wordpress/i18n';

import {
	PanelBody,
	__experimentalDimensionControl as DimensionControl,
} from '@wordpress/components';

export default function Inspector( props ) {
	const {
		setBackgroundColor,
		backgroundColor,
		attributes,
		setAttributes,
	} = props;

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

	return (
		<InspectorControls>
			<PanelColorSettings
				title={ __( 'Color Settings' ) }
				colorSettings={ [
					{
						value: backgroundColor.color,
						onChange: setBackgroundColor,
						label: __( 'Background Color' ),
					},
				] }
			/>

			<PanelBody title={ __( 'Spacing' ) }>

				<DimensionControl
					label={ __( 'Padding' ) }
					value={ attributes.paddingSize }
					onChange={ partialRight( updateSpacing, 'paddingSize' ) }
				/>

				<DimensionControl
					label={ __( 'Margin' ) }
					value={ attributes.marginSize }
					onChange={ partialRight( updateSpacing, 'marginSize' ) }
				/>

			</PanelBody>
		</InspectorControls>
	);
}
