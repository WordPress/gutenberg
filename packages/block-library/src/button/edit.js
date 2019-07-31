/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Component,
} from '@wordpress/element';
import {
	compose,
	withInstanceId,
} from '@wordpress/compose';
import {
	withFallbackStyles,
	PanelBody,
	TextControl,
	ToggleControl,
	BaseControl,
} from '@wordpress/components';
import {
	URLInput,
	RichText,
	ContrastChecker,
	InspectorControls,
	withColors,
	PanelColorSettings,
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

class ButtonEdit extends Component {
	constructor() {
		super( ...arguments );
		this.nodeRef = null;
		this.bindRef = this.bindRef.bind( this );
		this.onSetLinkRel = this.onSetLinkRel.bind( this );
		this.onToggleOpenInNewTab = this.onToggleOpenInNewTab.bind( this );
	}

	bindRef( node ) {
		if ( ! node ) {
			return;
		}
		this.nodeRef = node;
	}

	onSetLinkRel( value ) {
		this.props.setAttributes( { rel: value } );
	}

	onToggleOpenInNewTab( value ) {
		const { rel } = this.props.attributes;
		const linkTarget = value ? '_blank' : undefined;

		let updatedRel = rel;
		if ( linkTarget && ! rel ) {
			updatedRel = NEW_TAB_REL;
		} else if ( ! linkTarget && rel === NEW_TAB_REL ) {
			updatedRel = undefined;
		}

		this.props.setAttributes( {
			linkTarget,
			rel: updatedRel,
		} );
	}

	render() {
		const {
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
		} = this.props;

		const {
			text,
			url,
			title,
			linkTarget,
			rel,
			placeholder,
		} = attributes;

		const linkId = `wp-block-button__inline-link-${ instanceId }`;

		return (
			<div className={ className } title={ title } ref={ this.bindRef }>
				<RichText
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					withoutInteractiveFormatting
					className={ classnames(
						'wp-block-button__link', {
							'has-background': backgroundColor.color,
							[ backgroundColor.class ]: backgroundColor.class,
							'has-text-color': textColor.color,
							[ textColor.class ]: textColor.class,
						}
					) }
					style={ {
						backgroundColor: backgroundColor.color,
						color: textColor.color,
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
								onChange: setBackgroundColor,
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
					<PanelBody title={ __( 'Link Settings' ) }>
						<ToggleControl
							label={ __( 'Open in New Tab' ) }
							onChange={ this.onToggleOpenInNewTab }
							checked={ linkTarget === '_blank' }
						/>
						<TextControl
							label={ __( 'Link Rel' ) }
							value={ rel || '' }
							onChange={ this.onSetLinkRel }
						/>
					</PanelBody>
				</InspectorControls>
			</div>
		);
	}
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
	applyFallbackStyles,
] )( ButtonEdit );
