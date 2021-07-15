/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalUnitControl as UnitControl,
	BaseControl,
	Flex,
	FlexItem,
	__experimentalSegmentedControl as SegmentedControl,
	__experimentalSegmentedControlOption as SegmentedControlOption,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';

const SCALE_OPTIONS = (
	<>
		<SegmentedControlOption
			value="cover"
			label={ _x( 'Cover', 'Scale option for Image dimension control' ) }
		/>
		<SegmentedControlOption
			value="contain"
			label={ _x(
				'Contain',
				'Scale option for Image dimension control'
			) }
		/>
		<SegmentedControlOption
			value="fill"
			label={ _x(
				'Stretch',
				'Scale option for Image dimension control'
			) }
		/>
	</>
);

const DimensionControls = ( {
	attributes: { width, height, scale },
	setAttributes,
} ) => {
	const units = useCustomUnits( {
		availableUnits: [ 'px', '%', 'vw', 'em', 'rem' ],
	} );
	const onDimensionChange = ( dimension, nextValue ) => {
		setAttributes( {
			[ dimension ]: parseFloat( nextValue ) < 0 ? '0' : nextValue,
		} );
	};
	const scaleLabel = _x( 'Scale', 'Image scaling options' );
	return (
		<PanelBody title={ __( 'Dimensions' ) }>
			<Flex justify="space-between">
				<FlexItem>
					<UnitControl
						label={ __( 'Height' ) }
						labelPosition="top"
						value={ height || '' }
						onChange={ ( nextHeight ) => {
							onDimensionChange( 'height', nextHeight );
						} }
						units={ units }
					/>
				</FlexItem>
				<FlexItem>
					<UnitControl
						label={ __( 'Width' ) }
						labelPosition="top"
						value={ width || '' }
						onChange={ ( nextWidth ) => {
							onDimensionChange( 'width', nextWidth );
						} }
						units={ units }
					/>
				</FlexItem>
			</Flex>
			{ !! height && (
				<>
					<BaseControl
						aria-label={ scaleLabel }
						className="block-library-post-featured-image-scale-controls"
					>
						<div>
							<BaseControl.VisualLabel>
								{ scaleLabel }
							</BaseControl.VisualLabel>
						</div>
						<SegmentedControl
							label={ scaleLabel }
							value={ scale }
							onChange={ ( value ) => {
								setAttributes( {
									scale: value,
								} );
							} }
							isBlock
						>
							{ SCALE_OPTIONS }
						</SegmentedControl>
					</BaseControl>
				</>
			) }
		</PanelBody>
	);
};

export default DimensionControls;
