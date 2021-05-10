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
	Button,
} from '@wordpress/components';
import { Platform } from '@wordpress/element';

const isWeb = Platform.OS === 'web';
const CSS_UNITS = [
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '',
	},
	{
		value: '%',
		label: isWeb ? '%' : __( 'Percentage (%)' ),
		default: '',
	},
	{
		value: 'vw',
		label: isWeb ? 'vw' : __( 'Viewport width (vw)' ),
		default: '',
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '',
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '',
	},
];
const SCALE_OPTIONS = [
	{
		label: _x( 'Cover', 'Scale option for Image dimension control' ),
		value: 'cover',
	},
	{
		label: _x( 'Contain', 'Scale option for Image dimension control' ),
		value: 'contain',
	},
	{
		label: _x( 'Stretch', 'Scale option for Image dimension control' ),
		value: 'fill',
	},
];

const DimensionControls = ( {
	attributes: { width, height, scale },
	setAttributes,
} ) => {
	const dimensionsAreSet = width && height;
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
						units={ CSS_UNITS }
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
						units={ CSS_UNITS }
					/>
				</FlexItem>
			</Flex>
			{ dimensionsAreSet && (
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
						<Flex>
							{ SCALE_OPTIONS.map( ( { value, label } ) => {
								const isActive = value === scale;
								return (
									<FlexItem
										key={ value }
										style={ { width: '100%' } }
									>
										<Button
											isPrimary={ isActive }
											isPressed={ isActive }
											onClick={ () =>
												setAttributes( {
													scale: isActive
														? undefined
														: value,
												} )
											}
										>
											{ label }
										</Button>
									</FlexItem>
								);
							} ) }
						</Flex>
					</BaseControl>
				</>
			) }
		</PanelBody>
	);
};

export default DimensionControls;
