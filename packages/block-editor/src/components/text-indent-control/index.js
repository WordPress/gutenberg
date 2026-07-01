/**
 * WordPress dependencies
 */
import {
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalView as View,
	RangeControl,
	__experimentalSpacer as Spacer,
	Flex,
	FlexItem,
	BaseControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../../components/use-settings';

/**
 * Control for line text indent.
 *
 * @param {Object}                  props                      Component props.
 * @param {string}                  props.value                Currently selected text indent.
 * @param {Function}                props.onChange             Handles change in text indent selection.
 * @param {string|number|undefined} props.__unstableInputWidth Input width to pass through to inner UnitControl. Should be a valid CSS value.
 * @param {boolean}                 props.withSlider           Whether to show the slider control.
 * @param {boolean}                 props.hasBottomMargin      Whether to add bottom margin below the control.
 * @param {string}                  props.help                 Help text to display below the control.
 *
 * @return {Element} Text indent control.
 */
export default function TextIndentControl( {
	value,
	onChange,
	__unstableInputWidth = '60px',
	withSlider = false,
	hasBottomMargin = false,
	help,
	...otherProps
} ) {
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [
			'px',
			'em',
			'rem',
			'ch',
			'%',
			'vw',
			'vh',
		],
		defaultValues: { px: 16, em: 2, rem: 2, ch: 2 },
	} );

	const [ valueQuantity, valueUnit ] = parseQuantityAndUnitFromRawValue(
		value,
		units
	);
	const isValueUnitRelative =
		!! valueUnit &&
		[ 'em', 'rem', '%', 'ch', 'vw', 'vh' ].includes( valueUnit );

	if ( ! withSlider ) {
		return (
			<UnitControl
				{ ...otherProps }
				__next40pxDefaultSize
				label={ __( 'Line indent' ) }
				value={ value }
				__unstableInputWidth={ __unstableInputWidth }
				units={ units }
				onChange={ onChange }
				help={ help }
			/>
		);
	}

	return (
		<View style={ hasBottomMargin ? { marginBottom: 12 } : undefined }>
			<BaseControl.VisualLabel>
				{ __( 'Line indent' ) }
			</BaseControl.VisualLabel>
			<Flex>
				<FlexItem isBlock>
					<UnitControl
						__next40pxDefaultSize
						label={ __( 'Line indent' ) }
						labelPosition="top"
						hideLabelFromVision
						value={ value }
						onChange={ onChange }
						units={ units }
						__unstableInputWidth={ __unstableInputWidth }
						min={ 0 }
					/>
				</FlexItem>
				{ withSlider && (
					<FlexItem isBlock>
						<Spacer marginX={ 2 } marginBottom={ 0 }>
							<RangeControl
								label={ __( 'Line indent' ) }
								hideLabelFromVision
								value={ valueQuantity }
								withInputField={ false }
								onChange={ ( newValue ) => {
									if ( newValue === undefined ) {
										onChange?.( undefined );
									} else {
										onChange?.(
											newValue + ( valueUnit ?? 'px' )
										);
									}
								} }
								min={ 0 }
								max={ isValueUnitRelative ? 10 : 100 }
								step={ isValueUnitRelative ? 0.1 : 1 }
								initialPosition={ 0 }
							/>
						</Spacer>
					</FlexItem>
				) }
			</Flex>
			{ help && (
				<p className="components-base-control__help">{ help }</p>
			) }
		</View>
	);
}
