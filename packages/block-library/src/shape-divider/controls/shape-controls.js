/**
 * WordPress dependencies
 */
import {
	useSetting,
	__experimentalColorGradientControl as ColorGradientControl,
} from '@wordpress/block-editor';
import {
	Button,
	RangeControl,
	SelectControl,
	TextareaControl,
} from '@wordpress/components';
import { edit, reusableBlock } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SHAPE_TYPES, CUSTOM_SHAPE_STYLES, generateShapeSeed } from '../shapes';

// Defining empty array here instead of inline avoids unnecessary re-renders of
// color control.
const EMPTY_ARRAY = [];

const getTypeLabel = ( type ) => {
	return SHAPE_TYPES.find( ( shapeType ) => shapeType.value === type )?.label;
};

const ShapeControls = ( { shape, onChange } ) => {
	const {
		color,
		complexity,
		customCode,
		delta,
		height,
		opacity,
		style,
		type,
	} = shape;

	const isCustomShape = type === 'custom';
	const isUserSupplied = type === 'user';

	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const disableCustomColors = ! useSetting( 'color.custom' );
	const disableCustomGradients = ! useSetting( 'color.customGradient' );

	return (
		<>
			<h3 className="shape-divider-controls__subtitle">
				{ getTypeLabel( type ) }
				<span>
					{ isCustomShape && (
						<Button
							icon={ reusableBlock }
							label={ __( 'Randomize shape' ) }
							onClick={ () => onChange( {
								seed: generateShapeSeed(),
							} ) }
						/>
					) }
					<Button
						icon={ edit }
						label={ __( 'Change shape type' ) }
						onClick={ () => onChange( {
							type: undefined,
							style: undefined,
						} ) }
					/>
				</span>
			</h3>
			{ isCustomShape && (
				<div className="shape-divider-controls__style">
					<SelectControl
						label={ __( 'Style' ) }
						value={ style }
						options={ CUSTOM_SHAPE_STYLES }
						onChange={ ( value ) => onChange( { style: value } ) }
					/>
				</div>
			) }
			{ isCustomShape && (
				<RangeControl
					label={ __( 'Complexity' ) }
					value={ complexity }
					onChange={ ( value ) => onChange( { complexity: value } ) }
					min={ 2 }
					max={ 40 }
					withInputField={ false }
				/>
			) }
			{ isCustomShape && (
				<RangeControl
					label={ __( 'Delta' ) }
					value={ delta }
					onChange={ ( value ) => onChange( { delta: value } ) }
					min={ 0 }
					max={ 75 }
					withInputField={ false }
				/>
			) }
			{ ! isUserSupplied && (
				<>
					<RangeControl
						className={ 'shape-divider-controls__height' }
						label={ __( 'Height' ) }
						value={ height }
						onChange={ ( value ) => onChange( { height: value } ) }
						min={ 1 }
						max={ 100 }
						withInputField={ false }
					/>
					<RangeControl
						label={ __( 'Opacity' ) }
						value={ opacity }
						onChange={ ( value ) => onChange( { opacity: value } ) }
						min={ 0 }
						max={ 1 }
						step={ 0.01 }
						withInputField={ false }
					/>
					<ColorGradientControl
						label={ __( 'Color' ) }
						value={ color }
						colors={ colors }
						gradients={ undefined }
						disableCustomColors={ disableCustomColors }
						disableCustomGradients={ disableCustomGradients }
						onColorChange={ ( value ) => onChange( { color: value } ) }
					/>
				</>
			) }
			{ isUserSupplied && (
				<TextareaControl
					className="shape-divider-controls__custom-code"
					label={ __( 'SVG' ) }
					value={ customCode }
					onChange={ ( value ) => onChange( { customCode: value } ) }
				/>
			) }
		</>
	);
};

export default ShapeControls;
