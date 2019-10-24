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
	BaseControl,
	PanelBody,
	RangeControl,
	TextControl,
	ToggleControl,
	withFallbackStyles,
} from '@wordpress/components';
import {
	__experimentalGradientPickerPanel,
	ContrastChecker,
	InspectorControls,
	PanelColorSettings,
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
	instanceId,
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
		customGradient,
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

	const linkId = `wp-block-button__inline-link-${ instanceId }`;
	return (
		<div className={ className } title={ title }>
			<RichText
				placeholder={ placeholder || __( 'Add text…' ) }
				value={ text }
				onChange={ ( value ) => setAttributes( { text: value } ) }
				withoutInteractiveFormatting
				className={ classnames(
					'wp-block-button__link', {
						'has-background': backgroundColor.color || customGradient,
						[ backgroundColor.class ]: ! customGradient && backgroundColor.class,
						'has-text-color': textColor.color,
						[ textColor.class ]: textColor.class,
						'no-border-radius': borderRadius === 0,
					}
				) }
				style={ {
					backgroundColor: ! customGradient && backgroundColor.color,
					background: customGradient,
					color: textColor.color,
					borderRadius: borderRadius ? borderRadius + 'px' : undefined,
				} }
			/>
			<BaseControl
				label={ __( 'Link' ) }
				className="wp-block-button__inline-link"
				id={ linkId }>
				<URLInput
					className="wp-block-button__inline-link-input"
					value={ url }
					/* eslint-disable jsx-a11y/no-autofocus */
					// Disable Reason: The rule is meant to prevent enabling auto-focus, not disabling it.
					autoFocus={ false }
					/* eslint-enable jsx-a11y/no-autofocus */
					onChange={ ( value ) => setAttributes( { url: value } ) }
					disableSuggestions={ ! isSelected }
					id={ linkId }
					isFullWidth
					hasBorder
				/>
			</BaseControl>
			<InspectorControls>
				<PanelColorSettings
					title={ __( 'Color Settings' ) }
					colorSettings={ [
						{
							value: backgroundColor.color,
							onChange: ( newColor ) => {
								setAttributes( { customGradient: undefined } );
								setBackgroundColor( newColor );
							},
							label: __( 'Background Color' ),
						},
						{
							value: textColor.color,
							onChange: setTextColor,
							label: __( 'Text Color' ),
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
				</PanelColorSettings>
				<__experimentalGradientPickerPanel
					onChange={
						( newGradient ) => {
							setAttributes( {
								customGradient: newGradient,
								backgroundColor: undefined,
								customBackgroundColor: undefined,
							} );
						}
					}
					value={ customGradient }
				/>
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
