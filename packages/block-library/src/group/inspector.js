/**
 * External dependencies
 */
import { partialRight, startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	PanelColorSettings,
	DimensionControl,
} from '@wordpress/block-editor';

import { __ } from '@wordpress/i18n';

import {
	PanelBody,
	ToggleControl,
} from '@wordpress/components';

import {
	Fragment,
} from '@wordpress/element';

export default function Inspector( props ) {
	const {
		clientId,
		setBackgroundColor,
		backgroundColor,
		attributes,
		setAttributes,
	} = props;

	/**
	 * Resets a single spacing attribute for a given dimension
	 * (and optionally a given device)
	 * @param  {string} dimension the dimension property (eg: `padding`)
	 * @param  {string} device    the device which this dimension applies to (eg: `mobile`, `tablet`)
	 * @return {void}
	 */
	const resetSpacingDimension = ( dimension, device = '' ) => {
		setAttributes( {
			[ `${ dimension }${ device }` ]: '',
		} );
	};

	/**
	 * Resets all the responsive attributes for a given dimension
	 * @param  {string} dimension the dimension property (eg: `padding`)
	 * @return {void}
	 */
	const resetResponsiveSpacingForDimension = ( dimension ) => {
		dimension = dimension.toLowerCase();

		setAttributes( {
			[ `${ dimension }SizeMobile` ]: '',
			[ `${ dimension }SizeTablet` ]: '',
		} );
	};

	/**
	 * Updates the spacing attribute for a given dimension
	 * (and optionally a given device)
	 * @param  {string} dimension the dimension property (eg: `padding`)
	 * @param  {string} size      a slug representing a dimension size (eg: `medium`)
	 * @param  {string} device    the device which this dimension applies to (eg: `mobile`, `tablet`)
	 * @return {void}
	 */
	const updateSpacing = ( dimension, size, device = '' ) => {
		setAttributes( {
			[ `${ dimension }${ device }` ]: size,
		} );
	};

	/**
	 * Toggles the responsive spacing UI for a given dimension
	 * and clears any responsive attribute
	 * @param  {string} dimension the dimension property (eg: `padding`)
	 * @return {void}
	 */
	const onToggleResponsiveSpacing = ( dimension ) => {
		dimension = startCase( dimension );

		const attr = `responsive${ dimension }`;
		const responsiveDimensionState = ! attributes[ attr ];

		if ( ! responsiveDimensionState ) {
			resetResponsiveSpacingForDimension( dimension );
		}
		setAttributes( {
			[ attr ]: responsiveDimensionState,
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

				<fieldset className="block-editor-responsive-controls">
					<legend className="block-editor-responsive-controls__label">{ __( 'Padding' ) } </legend>
					<ToggleControl
						label={ __( 'Manually adjust Padding based on screensize?' ) }
						checked={ attributes.responsivePadding }
						onChange={ () => onToggleResponsiveSpacing( 'padding' ) }
					/>

					{ ! attributes.responsivePadding && (
						<DimensionControl
							title={ __( 'Padding' ) }
							property="padding"
							clientId={ clientId }
							onReset={ resetSpacingDimension }
							onSpacingChange={ updateSpacing }
							currentSize={ attributes.paddingSize }
							device="all"
							deviceIcon="desktop"
						/>
					) }

					{ attributes.responsivePadding && (
						<Fragment>
							<DimensionControl
								title={ __( 'Padding' ) }
								property="padding"
								clientId={ clientId }
								onReset={ resetSpacingDimension }
								onSpacingChange={ updateSpacing }
								currentSize={ attributes.paddingSize }
								device="desktop"
							/>

							<DimensionControl
								title={ __( 'Padding' ) }
								property="padding"
								clientId={ clientId }
								onReset={ partialRight( resetSpacingDimension, 'Tablet' ) }
								onSpacingChange={ partialRight( updateSpacing, 'Tablet' ) }
								currentSize={ attributes.paddingSizeTablet }
								device="tablet"
								deviceIcon="tablet"
							/>

							<DimensionControl
								title={ __( 'Padding' ) }
								property="padding"
								clientId={ clientId }
								onReset={ partialRight( resetSpacingDimension, 'Mobile' ) }
								onSpacingChange={ partialRight( updateSpacing, 'Mobile' ) }
								currentSize={ attributes.paddingSizeMobile }
								device="mobile"
								deviceIcon="smartphone"
							/>

						</Fragment>
					) }
				</fieldset>

				<fieldset className="block-editor-responsive-controls">
					<legend className="block-editor-responsive-controls__label">{ __( 'Margin' ) }</legend>
					<ToggleControl
						label={ __( 'Manually adjust Margin based on screensize?' ) }
						checked={ attributes.responsiveMargin }
						onChange={ () => onToggleResponsiveSpacing( 'margin' ) }
					/>

					{ ! attributes.responsiveMargin && (
						<DimensionControl
							title={ __( 'Margin' ) }
							property="margin"
							clientId={ clientId }
							onReset={ resetSpacingDimension }
							onSpacingChange={ updateSpacing }
							currentSize={ attributes.marginSize }
							device="all"
							deviceIcon="desktop"
						/>
					) }

					{ attributes.responsiveMargin && (
						<Fragment>
							<DimensionControl
								title={ __( 'Margin' ) }
								property="margin"
								clientId={ clientId }
								onReset={ resetSpacingDimension }
								onSpacingChange={ updateSpacing }
								currentSize={ attributes.marginSize }
								device="desktop"
							/>

							<DimensionControl
								title={ __( 'Margin' ) }
								property="margin"
								clientId={ clientId }
								onReset={ partialRight( resetSpacingDimension, 'Tablet' ) }
								onSpacingChange={ partialRight( updateSpacing, 'Tablet' ) }
								currentSize={ attributes.marginSizeTablet }
								device="tablet"
								deviceIcon="tablet"
							/>

							<DimensionControl
								title={ __( 'Margin' ) }
								property="margin"
								clientId={ clientId }
								onReset={ partialRight( resetSpacingDimension, 'Mobile' ) }
								onSpacingChange={ partialRight( updateSpacing, 'Mobile' ) }
								currentSize={ attributes.marginSizeMobile }
								device="mobile"
								deviceIcon="smartphone"
							/>

						</Fragment>
					) }
				</fieldset>

			</PanelBody>
		</InspectorControls>
	);
}
