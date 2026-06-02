/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	PanelColorSettings,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	__experimentalNumberControl as NumberControl,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function Edit( { attributes, setAttributes } ) {
	const {
		label,
		value,
		max = 100,
		backgroundColor,
		progressColor,
		height,
		showValue,
		symbol,
		symbolPosition,
		showTotal,
		seprator,
	} = attributes;

	const blockProps = useBlockProps( {
		className: 'wp-block-progress-meter',
	} );

	const progressBarStyle = {
		backgroundColor,
		height: `${ height }px`,
	};

	const progressStyle = {
		backgroundColor: progressColor,
		width: `${ ( value / max ) * 100 }%`,
	};

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const formatValue = ( val ) => {
		return symbolPosition === 'prefix'
			? `${ symbol }${ val }`
			: `${ val }${ symbol }`;
	};

	const valueDisplay = showTotal
		? `${ formatValue( value ) } ${ seprator } ${ formatValue( max ) }`
		: formatValue( value );

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Progress Meter Settings' ) }
					resetAll={ () => {
						setAttributes( {
							label: '',
							value: 50,
							max: 100,
							backgroundColor: '#f0f0f0',
							progressColor: '#1E1E1E',
							height: 11,
							showValue: true,
							symbol: '%',
							symbolPosition: 'suffix',
							showTotal: false,
							seprator: '/',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Progress Value' ) }
						isShownByDefault
						hasValue={ () => value !== 50 }
						onDeselect={ () => setAttributes( { value: 50 } ) }
					>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Progress Value' ) }
							value={ value }
							onChange={ ( currentValue ) =>
								setAttributes( { value: currentValue } )
							}
							min={ 0 }
							max={ max }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Maximum Value' ) }
						isShownByDefault
						hasValue={ () => max !== 100 }
						onDeselect={ () => setAttributes( { max: 100 } ) }
					>
						<NumberControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							isShiftStepEnabled
							shiftStep={ 10 }
							label={ __( 'Maximum Value' ) }
							value={ max }
							onChange={ ( maxValue ) =>
								setAttributes( { max: maxValue } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Bar height' ) }
						isShownByDefault
						hasValue={ () => height !== 11 }
						onDeselect={ () => setAttributes( { height: 11 } ) }
					>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Bar height' ) }
							help={ __( 'Height in pixels' ) }
							value={ height }
							onChange={ ( heightValue ) =>
								setAttributes( { height: heightValue } )
							}
							min={ 1 }
							max={ 30 }
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						label={ __( 'Show value' ) }
						isShownByDefault
						hasValue={ () => ! showValue }
						onDeselect={ () =>
							setAttributes( { showValue: true } )
						}
					>
						<ToggleControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Show value' ) }
							checked={ showValue }
							onChange={ () =>
								setAttributes( {
									showValue: ! showValue,
								} )
							}
						/>
					</ToolsPanelItem>
					{ showValue && (
						<ToolsPanelItem
							label={ __( 'Show total value' ) }
							isShownByDefault
							hasValue={ () => showTotal }
							onDeselect={ () =>
								setAttributes( { showTotal: false } )
							}
						>
							<ToggleControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Show total value' ) }
								checked={ showTotal }
								onChange={ () =>
									setAttributes( {
										showTotal: ! showTotal,
									} )
								}
							/>
						</ToolsPanelItem>
					) }
					{ showValue && showTotal && (
						<ToolsPanelItem
							label={ __( 'Value Seprator' ) }
							isShownByDefault
							hasValue={ () => seprator !== '/' }
							onDeselect={ () =>
								setAttributes( { seprator: '/' } )
							}
						>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Value Seprator' ) }
								value={ seprator }
								onChange={ ( newSeprator ) =>
									setAttributes( {
										seprator: newSeprator,
									} )
								}
							/>
						</ToolsPanelItem>
					) }
					{ showValue && (
						<>
							<ToolsPanelItem
								label={ __( 'Value Symbol' ) }
								isShownByDefault
								hasValue={ () => symbol !== '%' }
								onDeselect={ () =>
									setAttributes( { symbol: '%' } )
								}
							>
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'Value Symbol' ) }
									value={ symbol }
									onChange={ ( newSymbol ) =>
										setAttributes( {
											symbol: newSymbol,
										} )
									}
								/>
							</ToolsPanelItem>
							<ToolsPanelItem
								label={ __( 'Symbol Position' ) }
								isShownByDefault
								hasValue={ () => symbolPosition !== 'suffix' }
								onDeselect={ () =>
									setAttributes( {
										symbolPosition: 'suffix',
									} )
								}
							>
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'Symbol Position' ) }
									value={ symbolPosition }
									options={ [
										{
											label: __( 'Before number' ),
											value: 'prefix',
										},
										{
											label: __( 'After number' ),
											value: 'suffix',
										},
									] }
									onChange={ ( position ) =>
										setAttributes( {
											symbolPosition: position,
										} )
									}
								/>
							</ToolsPanelItem>
						</>
					) }
				</ToolsPanel>
				<PanelColorSettings
					title={ __( 'Color Settings' ) }
					colorSettings={ [
						{
							value: backgroundColor,
							onChange: ( bgColor ) =>
								setAttributes( { backgroundColor: bgColor } ),
							label: __( 'Background Color' ),
						},
						{
							value: progressColor,
							onChange: ( progressBarColor ) =>
								setAttributes( {
									progressColor: progressBarColor,
								} ),
							label: __( 'Progress Color' ),
						},
					] }
				/>
			</InspectorControls>

			<div className="wp-block-progress-meter__container">
				<div>
					<RichText
						identifier="value"
						tagName="p"
						className="wp-block-progress-meter__label"
						value={ label }
						onChange={ ( content ) =>
							setAttributes( { label: content } )
						}
						placeholder={ __( 'Write heading…' ) }
					/>
					{ showValue && <p>{ valueDisplay }</p> }
				</div>

				<div
					style={ progressBarStyle }
					className="wp-block-progress-meter__bar"
				>
					<div
						style={ progressStyle }
						className="wp-block-progress-meter__progress"
					></div>
				</div>
			</div>
		</div>
	);
}
