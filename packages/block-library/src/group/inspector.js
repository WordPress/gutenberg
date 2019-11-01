/**
 * External dependencies
 */
import { partialRight, upperFirst } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	PanelColorSettings,
	__experimentalResponsiveBlockControl as ResponsiveBlockControl,
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
	 * @param  {string} viewport    the viewport which this dimension applies to (eg: `mobile`, `tablet`)
	 * @return {void}
	 */
	const updateSpacing = ( value, dimensionAttr, viewport = '' ) => {
		// If there is a viewport then reset the default attribute
		// and update the responsive setting. Otherwise, set the
		// default value and reset ALL the responsive settings
		if ( viewport.length ) {
			setAttributes( {
				[ dimensionAttr ]: '',
				[ `${ dimensionAttr }${ viewport }` ]: value,
			} );
		} else {
			setAttributes( {
				[ dimensionAttr ]: value,
				[ `${ dimensionAttr }Small` ]: '',
				[ `${ dimensionAttr }Medium` ]: '',
				[ `${ dimensionAttr }Large` ]: '',
			} );
		}
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

				<ResponsiveBlockControl
					title={ __( 'Padding' ) }
					property={ 'padding' }
					isResponsive={ attributes.responsivePadding }
					onIsResponsiveChange={ () => {
						setAttributes( {
							responsivePadding: ! attributes.responsivePadding,
						} );
					} }
					renderDefaultControl={ ( labelComponent, viewport ) => {
						const dimensionAttr = 'paddingSize';
						const viewportSize = viewport.id !== 'all' ? upperFirst( viewport.id ) : '';
						const value = attributes[ `paddingSize${ viewportSize }` ];

						return (
							<DimensionControl
								label={ labelComponent }
								value={ value }
								onChange={ partialRight( updateSpacing, dimensionAttr, viewportSize ) }
							/>
						);
					} }

				/>
			</PanelBody>
		</InspectorControls>
	);
}
