/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalUnitControl as UnitControl,
	Flex,
	FlexItem,
	__experimentalSegmentedControl as SegmentedControl,
	__experimentalSegmentedControlOption as SegmentedControlOption,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { useSetting } from '@wordpress/block-editor';

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
			label={ _x( 'Fill', 'Scale option for Image dimension control' ) }
		/>
	</>
);

const scaleHelp = {
	cover: __(
		'Image is sized to maintain its aspect ratio and cropped to fill the entire space.'
	),
	contain: __(
		'Image is scaled to fill the space without clipping the content.'
	),
	fill: __(
		'Image will be stretched and distorted to completely fill the space.'
	),
};

const DimensionControls = ( {
	attributes: { width, height, scale },
	setAttributes,
} ) => {
	const defaultUnits = [ 'px', '%', 'vw', 'em', 'rem' ];
	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || defaultUnits,
	} );
	const onDimensionChange = ( dimension, nextValue ) => {
		const parsedValue = parseFloat( nextValue );
		/**
		 * If we have no value set and we change the unit,
		 * we don't want to set the attribute, as it would
		 * end up having the unit as value without any number.
		 */
		if ( isNaN( parsedValue ) && nextValue ) return;
		setAttributes( {
			[ dimension ]: parsedValue < 0 ? '0' : nextValue,
		} );
	};
	const scaleLabel = _x( 'Scale', 'Image scaling options' );
	return (
		<PanelBody title={ __( 'Dimensions' ) }>
			<Flex
				justify="space-between"
				className={ classNames(
					'block-library-post-featured-image-dimension-controls',
					{ 'scale-control-is-visible': !! height }
				) }
			>
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
				<SegmentedControl
					label={ scaleLabel }
					value={ scale }
					help={ scaleHelp[ scale ] }
					onChange={ ( value ) => {
						setAttributes( {
							scale: value,
						} );
					} }
					isBlock
				>
					{ SCALE_OPTIONS }
				</SegmentedControl>
			) }
		</PanelBody>
	);
};

export default DimensionControls;
