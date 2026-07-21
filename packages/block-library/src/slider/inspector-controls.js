/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	RangeControl,
	SelectControl,
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
		navigationButtonType = 'icon',
		navigationPosition = 'overlay',
		navigationJustification = 'space-between',
		showIndicators = true,
	} = attributes;

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Slider settings' ) }>
				<RangeControl
					label={ __( 'Slides to show' ) }
					help={ __( 'Number of slides visible at the same time.' ) }
					value={ normalizedSlidesToShow }
					min={ 1 }
					max={ maxSlidesToShow }
					step={ 1 }
					withInputField
					onChange={ ( value ) =>
						setAttributes( {
							slidesToShow: Math.min(
								maxSlidesToShow,
								Math.max( 1, Number.parseInt( value, 10 ) || 1 )
							),
						} )
					}
				/>
				<ToggleControl
					label={ __( 'Loop' ) }
					help={ __( 'Loop back to the first or last slide.' ) }
					checked={ !! loop }
					onChange={ ( value ) => setAttributes( { loop: value } ) }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Pagination' ) }>
				<SelectControl
					label={ __( 'Position' ) }
					value={ navigationPosition }
					options={ ARROWS_POSITION_OPTIONS }
					onChange={ ( value ) =>
						setAttributes( { navigationPosition: value } )
					}
				/>
				{ navigationPosition !== 'overlay' && (
					<NavigationJustificationControl
						value={ navigationJustification }
						onChange={ ( value ) =>
							setAttributes( { navigationJustification: value } )
						}
					/>
				) }
				<NavigationButtonTypeControl
					value={ navigationButtonType }
					onChange={ ( value ) =>
						setAttributes( { navigationButtonType: value } )
					}
				/>
				<NavigationButtonIconControl
					value={ arrowIcon }
					onChange={ ( value ) =>
						setAttributes( { arrowIcon: value } )
					}
				/>
				<ToggleControl
					label={ __( 'Show indicators' ) }
					checked={ !! showIndicators }
					onChange={ ( value ) =>
						setAttributes( { showIndicators: value } )
					}
				/>
				{ showIndicators && (
					<IndicatorStyleControl
						value={ indicatorStyle }
						onChange={ ( value ) =>
							setAttributes( { indicatorStyle: value } )
						}
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
