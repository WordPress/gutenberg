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
import { useSettings } from '../../components/use-settings';
import type { TextIndentControlProps } from './types';

/**
 * Control for line text indent.
 *
 * @param props                      Component props.
 * @param props.value                Currently selected text indent.
 * @param props.onChange             Handles change in text indent selection.
 * @param props.__unstableInputWidth Input width to pass through to inner UnitControl. Should be a valid CSS value.
 * @param props.withSlider           Whether to show the slider control.
 * @param props.hasBottomMargin      Whether to add bottom margin below the control.
 * @param props.help                 Help text to display below the control.
 * @param props.className            Class name to add to the inner UnitControl.
 * @param props.placeholder          Placeholder for the inner UnitControl.
 *
 * @return Text indent control.
 */
export default function TextIndentControl( {
	value,
	onChange,
	__unstableInputWidth = '60px',
	withSlider = false,
	hasBottomMargin = false,
	help,
	className,
	placeholder,
	...otherProps
}: TextIndentControlProps ) {
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		// The setting lists unit strings.
		availableUnits: ( availableUnits as string[] | undefined ) || [
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
				label={ __( 'Line indent' ) }
				value={ value }
				__unstableInputWidth={ __unstableInputWidth }
				units={ units }
				onChange={ onChange }
				help={ help }
				className={ className }
				placeholder={ placeholder }
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
						label={ __( 'Line indent' ) }
						labelPosition="top"
						hideLabelFromVision
						value={ value }
						onChange={ onChange }
						units={ units }
						__unstableInputWidth={ __unstableInputWidth }
						min={ 0 }
						className={ className }
						placeholder={ placeholder }
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
