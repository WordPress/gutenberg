/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useCallback,
} from '@wordpress/element';
import {
	compose,
	withInstanceId,
} from '@wordpress/compose';
import {
	PanelBody,
	RangeControl,
	TextControl,
	ToggleControl,
	withFallbackStyles,
} from '@wordpress/components';
import {
	__experimentalUseGradient,
	ContrastChecker,
	InspectorControls,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	RichText,
	URLInput,
	withColors,
} from '@wordpress/block-editor';

const { getComputedStyle } = window;

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor } = ownProps;
	const backgroundColorValue = backgroundColor && backgroundColor.color;
	const textColorValue = textColor && textColor.color;
	//avoid the use of querySelector if textColor color is known and verify if node is available.
	const textNode = ! textColorValue && node ? node.querySelector( '[contenteditable="true"]' ) : null;
	return {
		fallbackBackgroundColor: backgroundColorValue || ! node ? undefined : getComputedStyle( node ).backgroundColor,
		fallbackTextColor: textColorValue || ! textNode ? undefined : getComputedStyle( textNode ).color,
	};
} );

const NEW_TAB_REL = 'noreferrer noopener';
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_BORDER_RADIUS_POSITION = 5;

function BorderPanel( { borderRadius = '', setAttributes } ) {
	const setBorderRadius = useCallback(
		( newBorderRadius ) => {
			setAttributes( { borderRadius: newBorderRadius } );
		},
		[ setAttributes ]
	);
	return (
		<PanelBody title={ __( 'Border Settings' ) }>
			<RangeControl
				value={ borderRadius }
				label={ __( 'Border Radius' ) }
				min={ MIN_BORDER_RADIUS_VALUE }
				max={ MAX_BORDER_RADIUS_VALUE }
				initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
				allowReset
				onChange={ setBorderRadius }
			/>
		</PanelBody>
	);
}

function ButtonEdit( {
	attributes,
	backgroundColor,
	textColor,
	setBackgroundColor,
	setTextColor,
	fallbackBackgroundColor,
	fallbackTextColor,
	setAttributes,
	className,
	isSelected,
} ) {
	const {
		borderRadius,
		linkTarget,
		placeholder,
		rel,
		text,
		title,
		url,
	} = attributes;
	const onSetLinkRel = useCallback(
		( value ) => {
			setAttributes( { rel: value } );
		},
		[ setAttributes ]
	);

	const onToggleOpenInNewTab = useCallback(
		( value ) => {
			const newLinkTarget = value ? '_blank' : undefined;

			let updatedRel = rel;
			if ( newLinkTarget && ! rel ) {
				updatedRel = NEW_TAB_REL;
			} else if ( ! newLinkTarget && rel === NEW_TAB_REL ) {
				updatedRel = undefined;
			}

			setAttributes( {
				linkTarget: newLinkTarget,
				rel: updatedRel,
			} );
		},
		[ rel, setAttributes ]
	);
	const {
		gradientClass,
		gradientValue,
		setGradient,
	} = __experimentalUseGradient();

	return (
		<div className={ className } title={ title }>
			<RichText
				placeholder={ placeholder || __( 'Add text…' ) }
				value={ text }
				onChange={ ( value ) => setAttributes( { text: value } ) }
				withoutInteractiveFormatting
				className={ classnames(
					'wp-block-button__link', {
						'has-background': backgroundColor.color || gradientValue,
						[ backgroundColor.class ]: ! gradientValue && backgroundColor.class,
						'has-text-color': textColor.color,
						[ textColor.class ]: textColor.class,
						[ gradientClass ]: gradientClass,
						'no-border-radius': borderRadius === 0,
					}
				) }
				style={ {
					...( ! backgroundColor.color && gradientValue ?
						{ background: gradientValue } :
						{ backgroundColor: backgroundColor.color }
					),
					color: textColor.color,
					borderRadius: borderRadius ? borderRadius + 'px' : undefined,
				} }
			/>
			<URLInput
				label={ __( 'Link' ) }
				className="wp-block-button__inline-link"
				value={ url }
				/* eslint-disable jsx-a11y/no-autofocus */
				// Disable Reason: The rule is meant to prevent enabling auto-focus, not disabling it.
				autoFocus={ false }
				/* eslint-enable jsx-a11y/no-autofocus */
				onChange={ ( value ) => setAttributes( { url: value } ) }
				disableSuggestions={ ! isSelected }
				isFullWidth
				hasBorder
			/>
			<InspectorControls>
				<PanelColorGradientSettings
					title={ __( 'Background & Text Color' ) }
					settings={ [
						{
							colorValue: textColor.color,
							onColorChange: setTextColor,
							label: __( 'Text Color' ),
						},
						{
							colorValue: backgroundColor.color,
							onColorChange: setBackgroundColor,
							gradientValue,
							onGradientChange: setGradient,
							label: __( 'Background' ),
						},
					] }
				>
					<ContrastChecker
						{ ...{
							// Text is considered large if font size is greater or equal to 18pt or 24px,
							// currently that's not the case for button.
							isLargeText: false,
							textColor: textColor.color,
							backgroundColor: backgroundColor.color,
							fallbackBackgroundColor,
							fallbackTextColor,
						} }
					/>
				</PanelColorGradientSettings>
				<BorderPanel
					borderRadius={ borderRadius }
					setAttributes={ setAttributes }
				/>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Open in new tab' ) }
						onChange={ onToggleOpenInNewTab }
						checked={ linkTarget === '_blank' }
					/>
					<TextControl
						label={ __( 'Link rel' ) }
						value={ rel || '' }
						onChange={ onSetLinkRel }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
	applyFallbackStyles,
] )( ButtonEdit );
