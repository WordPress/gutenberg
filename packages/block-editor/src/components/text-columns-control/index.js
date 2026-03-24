/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { settings as settingsIcon } from '@wordpress/icons';
import {
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	BaseControl,
	Button,
} from '@wordpress/components';

const MIN_TEXT_COLUMNS = 1;
const MAX_TEXT_COLUMNS = 6;

const TEXT_COLUMN_MIN_WIDTH_OPTIONS = [
	{ label: __( 'S' ), value: '10em' },
	{ label: __( 'M' ), value: '16em' },
	{ label: __( 'L' ), value: '24em' },
];

const COLUMN_MIN_WIDTH_UNITS = [
	{ value: 'em', label: 'em', default: 24 },
	{ value: 'rem', label: 'rem', default: 24 },
	{ value: 'px', label: 'px', default: 300 },
];

/**
 * Control for managing text column count and column minimum width.
 *
 * @param {Object}   props                       Component props.
 * @param {number}   props.textColumns           Current column count value.
 * @param {Function} props.setTextColumns        Callback to update column count.
 * @param {string}   props.textColumnMinWidth    Current column min width value.
 * @param {Function} props.setTextColumnMinWidth Callback to update column min width.
 * @return {Element} Text columns control.
 */
export default function TextColumnsControl( {
	textColumns,
	setTextColumns,
	textColumnMinWidth,
	setTextColumnMinWidth,
} ) {
	const [ showCustomColumnMinWidth, setShowCustomColumnMinWidth ] =
		useState( false );

	const isCustomColumnMinWidth =
		!! textColumnMinWidth &&
		! TEXT_COLUMN_MIN_WIDTH_OPTIONS.some(
			( opt ) => opt.value === textColumnMinWidth
		);

	return (
		<>
			<NumberControl
				label={ __( 'Columns' ) }
				max={ MAX_TEXT_COLUMNS }
				min={ MIN_TEXT_COLUMNS }
				onChange={ setTextColumns }
				size="__unstable-large"
				spinControls="custom"
				value={ textColumns }
				initialPosition={ 1 }
			/>
			{ textColumns && textColumns > 1 && (
				<Spacer marginTop={ 4 }>
					<fieldset className="block-editor-typography-panel__column-min-width">
						<HStack className="block-editor-typography-panel__column-min-width-header">
							<BaseControl.VisualLabel as="legend">
								{ __( 'Min Width' ) }
							</BaseControl.VisualLabel>
							<Button
								label={
									showCustomColumnMinWidth ||
									isCustomColumnMinWidth
										? __( 'Use size preset' )
										: __( 'Set custom size' )
								}
								icon={ settingsIcon }
								onClick={ () => {
									if (
										showCustomColumnMinWidth ||
										isCustomColumnMinWidth
									) {
										// Switching back to presets - snap to nearest preset.
										if ( isCustomColumnMinWidth ) {
											setTextColumnMinWidth( '16em' );
										}
										setShowCustomColumnMinWidth( false );
									} else {
										setShowCustomColumnMinWidth( true );
									}
								} }
								isPressed={
									showCustomColumnMinWidth ||
									isCustomColumnMinWidth
								}
								size="small"
							/>
						</HStack>
						{ showCustomColumnMinWidth || isCustomColumnMinWidth ? (
							<UnitControl
								value={ textColumnMinWidth ?? '' }
								onChange={ setTextColumnMinWidth }
								units={ COLUMN_MIN_WIDTH_UNITS }
								size="__unstable-large"
							/>
						) : (
							<ToggleGroupControl
								__next40pxDefaultSize
								label={ __( 'Min Width' ) }
								hideLabelFromVision
								value={ textColumnMinWidth ?? '' }
								onChange={ setTextColumnMinWidth }
								isDeselectable
								isBlock
							>
								{ TEXT_COLUMN_MIN_WIDTH_OPTIONS.map(
									( option ) => (
										<ToggleGroupControlOption
											key={ option.value }
											value={ option.value }
											label={ option.label }
											aria-label={ option.label }
										/>
									)
								) }
							</ToggleGroupControl>
						) }
					</fieldset>
				</Spacer>
			) }
		</>
	);
}
