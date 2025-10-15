/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	PanelColorSettings,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	CustomSelectControl,
	RangeControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

/**
 * Default Constants
 */
const DEFAULT_HEIGHT = 15;
const DEFAULT_POSITION = 'top';

export default function ReadMore( { attributes, setAttributes } ) {
	const { backgroundColor, progressColor, height, position, isInverted } =
		attributes;
	const blockProps = useBlockProps();

	const readProgressStyle = {
		backgroundColor,
		height: height + 'px',
	};

	const progressStyle = {
		backgroundColor: progressColor,
		height: height + 'px',
		transform: 'scaleX(0.5)',
		transformOrigin: isInverted ? '100% 50%' : '0 50%',
	};

	if ( position === 'bottom' ) {
		readProgressStyle.top = 'auto';
		progressStyle.top = 'auto';
		readProgressStyle.bottom = 0;
		progressStyle.bottom = 0;
	}

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Reading Progress Bar Settings' ) }
					resetAll={ () => {
						setAttributes( {
							height: DEFAULT_HEIGHT,
							position: DEFAULT_POSITION,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Bar height' ) }
						isShownByDefault
						hasValue={ () => height !== DEFAULT_HEIGHT }
						onDeselect={ () =>
							setAttributes( { height: DEFAULT_HEIGHT } )
						}
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
						label={ __( 'Bar Position' ) }
						isShownByDefault
						hasValue={ () => position !== DEFAULT_POSITION }
						onDeselect={ () =>
							setAttributes( { position: DEFAULT_POSITION } )
						}
					>
						<CustomSelectControl
							__next40pxDefaultSize
							label={ __( 'Bar Position' ) }
							help={ __( 'Position of the bar' ) }
							value={ {
								key: position,
								name:
									position === 'top'
										? __( 'Top' )
										: __( 'Bottom' ),
							} }
							onChange={ ( positionValue ) => {
								setAttributes( {
									position: positionValue.selectedItem.key,
								} );
							} }
							options={ [
								{
									key: 'top',
									name: __( 'Top' ),
								},
								{
									key: 'bottom',
									name: __( 'Bottom' ),
								},
							] }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Inverted Bar' ) }
						isShownByDefault
						hasValue={ () => isInverted }
						onDeselect={ () =>
							setAttributes( { isInverted: false } )
						}
					>
						<ToggleControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Inverted Bar' ) }
							help={ __( 'Enabling this will invert the bar' ) }
							checked={ isInverted }
							onChange={ ( isInvertedValue ) =>
								setAttributes( {
									isInverted: isInvertedValue,
								} )
							}
						/>
					</ToolsPanelItem>
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
			<div className="wp-block-read-progress__container">
				<p className="wp-block-read-progress__selector">
					{ __( 'Reading Progress' ) }
				</p>
				<div
					style={ readProgressStyle }
					className="wp-block-read-progress__read-bar"
				>
					<div
						style={ progressStyle }
						className="wp-block-read-progress__progress-style"
					></div>
				</div>
			</div>
		</div>
	);
}
