/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	ToggleControl,
	RangeControl,
	SelectControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import {
	chevronLeft,
	arrowLeft,
	moreHorizontal,
	lineSolid,
	justifyLeft,
	justifyCenter,
	justifyRight,
	justifySpaceBetween,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const ARROWS_POSITION_OPTIONS = [
	{ label: __( 'Overlay' ), value: 'overlay' },
	{ label: __( 'Above' ), value: 'top' },
	{ label: __( 'Below' ), value: 'bottom' },
];

function NavigationButtonTypeControl( { value, onChange } ) {
	return (
		<ToggleGroupControl
			label={ __( 'Type' ) }
			value={ value }
			onChange={ onChange }
			isBlock
			help={ __( 'Adjust the appearance of buttons in the slider.' ) }
		>
			<ToggleGroupControlOption value="icon" label={ __( 'Icon' ) } />
			<ToggleGroupControlOption value="text" label={ __( 'Text' ) } />
			<ToggleGroupControlOption value="both" label={ __( 'Both' ) } />
		</ToggleGroupControl>
	);
}

function NavigationButtonIconControl( { value, onChange } ) {
	return (
		<ToggleGroupControl
			label={ __( 'Button icon' ) }
			value={ value }
			onChange={ onChange }
			help={ __( 'Icon style for the previous and next slide buttons.' ) }
			isBlock
		>
			<ToggleGroupControlOptionIcon
				value="chevron"
				icon={ chevronLeft }
				label={ __( 'Chevron' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="arrow"
				icon={ arrowLeft }
				label={ __( 'Arrow' ) }
			/>
		</ToggleGroupControl>
	);
}

function NavigationJustificationControl( { value, onChange } ) {
	return (
		<ToggleGroupControl
			label={ __( 'Justification' ) }
			value={ value }
			onChange={ onChange }
			isBlock
		>
			<ToggleGroupControlOptionIcon
				value="left"
				icon={ justifyLeft }
				label={ __( 'Justify left' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="center"
				icon={ justifyCenter }
				label={ __( 'Justify center' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="right"
				icon={ justifyRight }
				label={ __( 'Justify right' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="space-between"
				icon={ justifySpaceBetween }
				label={ __( 'Space between' ) }
			/>
		</ToggleGroupControl>
	);
}

function IndicatorStyleControl( { value, onChange } ) {
	return (
		<ToggleGroupControl
			label={ __( 'Indicator icon' ) }
			value={ value }
			onChange={ onChange }
			help={ __( 'Shape of the indicators showing the current slide.' ) }
			isBlock
		>
			<ToggleGroupControlOptionIcon
				value="dot"
				icon={ moreHorizontal }
				label={ __( 'Dot' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="line"
				icon={ lineSolid }
				label={ __( 'Line' ) }
			/>
		</ToggleGroupControl>
	);
}

export function SliderInspectorControls( {
	attributes,
	setAttributes,
	normalizedSlidesToShow,
	maxSlidesToShow,
} ) {
	const {
		loop,
		arrowIcon,
		indicatorStyle,
		navigationButtonType,
		navigationPosition,
		navigationJustification,
		showIndicators,
	} = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () =>
					setAttributes( {
						slidesToShow: 1,
						loop: true,
					} )
				}
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Slides to show' ) }
					isShownByDefault
					hasValue={ () => normalizedSlidesToShow !== 1 }
					onDeselect={ () => setAttributes( { slidesToShow: 1 } ) }
				>
					<RangeControl
						label={ __( 'Slides to show' ) }
						help={ __(
							'Number of slides visible at the same time on larger screens. One slide is always shown on mobile.'
						) }
						value={ normalizedSlidesToShow }
						min={ 1 }
						max={ maxSlidesToShow }
						step={ 1 }
						withInputField
						onChange={ ( value ) =>
							setAttributes( {
								slidesToShow: Math.min(
									maxSlidesToShow,
									Math.max(
										1,
										Number.parseInt( value, 10 ) || 1
									)
								),
							} )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Loop' ) }
					isShownByDefault
					hasValue={ () => ! loop }
					onDeselect={ () => setAttributes( { loop: true } ) }
				>
					<ToggleControl
						label={ __( 'Loop' ) }
						help={ __( 'Loop back to the first or last slide.' ) }
						checked={ !! loop }
						onChange={ ( value ) =>
							setAttributes( { loop: value } )
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
			<ToolsPanel
				label={ __( 'Pagination' ) }
				resetAll={ () =>
					setAttributes( {
						navigationPosition: 'overlay',
						navigationJustification: 'space-between',
						navigationButtonType: 'icon',
						arrowIcon: 'chevron',
						showIndicators: true,
						indicatorStyle: 'dot',
					} )
				}
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Position' ) }
					isShownByDefault
					hasValue={ () => navigationPosition !== 'overlay' }
					onDeselect={ () =>
						setAttributes( { navigationPosition: 'overlay' } )
					}
				>
					<SelectControl
						label={ __( 'Position' ) }
						value={ navigationPosition }
						options={ ARROWS_POSITION_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { navigationPosition: value } )
						}
					/>
				</ToolsPanelItem>
				{ navigationPosition !== 'overlay' && (
					<ToolsPanelItem
						label={ __( 'Justification' ) }
						isShownByDefault
						hasValue={ () =>
							navigationJustification !== 'space-between'
						}
						onDeselect={ () =>
							setAttributes( {
								navigationJustification: 'space-between',
							} )
						}
					>
						<NavigationJustificationControl
							value={ navigationJustification }
							onChange={ ( value ) =>
								setAttributes( {
									navigationJustification: value,
								} )
							}
						/>
					</ToolsPanelItem>
				) }
				<ToolsPanelItem
					label={ __( 'Button type' ) }
					isShownByDefault
					hasValue={ () => navigationButtonType !== 'icon' }
					onDeselect={ () =>
						setAttributes( { navigationButtonType: 'icon' } )
					}
				>
					<NavigationButtonTypeControl
						value={ navigationButtonType }
						onChange={ ( value ) =>
							setAttributes( { navigationButtonType: value } )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Button icon' ) }
					isShownByDefault
					hasValue={ () => arrowIcon !== 'chevron' }
					onDeselect={ () =>
						setAttributes( { arrowIcon: 'chevron' } )
					}
				>
					<NavigationButtonIconControl
						value={ arrowIcon }
						onChange={ ( value ) =>
							setAttributes( { arrowIcon: value } )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Show indicators' ) }
					isShownByDefault
					hasValue={ () => ! showIndicators }
					onDeselect={ () =>
						setAttributes( { showIndicators: true } )
					}
				>
					<ToggleControl
						label={ __( 'Show indicators' ) }
						checked={ !! showIndicators }
						onChange={ ( value ) =>
							setAttributes( { showIndicators: value } )
						}
					/>
				</ToolsPanelItem>
				{ showIndicators && (
					<ToolsPanelItem
						label={ __( 'Indicator icon' ) }
						isShownByDefault
						hasValue={ () => indicatorStyle !== 'dot' }
						onDeselect={ () =>
							setAttributes( { indicatorStyle: 'dot' } )
						}
					>
						<IndicatorStyleControl
							value={ indicatorStyle }
							onChange={ ( value ) =>
								setAttributes( { indicatorStyle: value } )
							}
						/>
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</InspectorControls>
	);
}
