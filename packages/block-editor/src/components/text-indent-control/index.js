/**
 * WordPress dependencies
 */
import {
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
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
 * @param {Object}                  props                       Component props.
 * @param {boolean}                 props.__next40pxDefaultSize Start opting into the larger default height that will become the default size in a future version.
 * @param {string}                  props.value                 Currently selected text indent.
 * @param {Function}                props.onChange              Handles change in text indent selection.
 * @param {string|number|undefined} props.__unstableInputWidth  Input width to pass through to inner UnitControl. Should be a valid CSS value.
 * @param {boolean}                 props.withSlider            Whether to show the slider control.
 * @param {string}                  props.help                  Help text to display below the control.
 *
 * @return {Element} Text indent control.
 */
export default function TextIndentControl( {
	__next40pxDefaultSize = false,
	value,
	onChange,
	__unstableInputWidth = '60px',
	withSlider = false,
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
		!! valueUnit && [ 'em', 'rem', 'ch', 'vw', 'vh' ].includes( valueUnit );

	if ( ! withSlider ) {
		return (
			<UnitControl
				__next40pxDefaultSize={ __next40pxDefaultSize }
				__shouldNotWarnDeprecated36pxSize
				{ ...otherProps }
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
		<>
			<BaseControl.VisualLabel>
				{ __( 'Line indent' ) }
			</BaseControl.VisualLabel>
			<Flex>
				<FlexItem isBlock>
					<UnitControl
						__next40pxDefaultSize={ __next40pxDefaultSize }
						__shouldNotWarnDeprecated36pxSize
						label={ __( 'Line indent' ) }
						labelPosition="top"
						hideLabelFromVision
						value={ value }
						onChange={ onChange }
						size={ otherProps.size }
						units={ units }
						__unstableInputWidth={ __unstableInputWidth }
						min={ 0 }
					/>
				</FlexItem>
				{ withSlider && (
					<FlexItem isBlock>
						<Spacer marginX={ 2 } marginBottom={ 0 }>
							<RangeControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize={ __next40pxDefaultSize }
								__shouldNotWarnDeprecated36pxSize
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
		</>
	);
}
