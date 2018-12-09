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
	Fragment,
} from '@wordpress/element';
import { compose } from '@wordpress/compose';
import {
	IconButton,
	withFallbackStyles,
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import {
	URLInput,
	URLPopover,
	RichText,
	ContrastChecker,
	InspectorControls,
	withColors,
	PanelColorSettings,
} from '@wordpress/editor';

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
		this.setLinkTarget = this.setLinkTarget.bind( this );
	}

	bindRef( node ) {
		if ( ! node ) {
			return;
		}
		this.nodeRef = node;
	}

	setLinkTarget( value ) {
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
			isSelected,
			className,
		} = this.props;

		const {
			text,
			url,
			title,
			linkTarget,
			rel,
			align,
		} = attributes;
		let popPosition = 'bottom right';
		if ( 'center' === align ) {
			popPosition = 'bottom center';
		} else if ( 'right' === align ) {
			popPosition = 'bottom left';
		}
		return (
			<Fragment>
				<div className={ className } title={ title } ref={ this.bindRef }>
					<RichText
						placeholder={ __( 'Add text…' ) }
						value={ text }
						onChange={ ( value ) => setAttributes( { text: value } ) }
						formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
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
						keepPlaceholderOnFocus
					/>
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
							<TextControl
								label={ __( 'Link URL' ) }
								value={ url }
								onChange={ ( value ) => setAttributes( { url: value } ) }
							/>
							<ToggleControl
								label={ __( 'Open in New Tab' ) }
								onChange={ this.setLinkTarget }
								checked={ linkTarget === '_blank' } />
							<TextControl
								label={ __( 'Link Rel' ) }
								value={ rel || '' }
								onChange={ ( value ) => setAttributes( { rel: value } ) }
							/>
						</PanelBody>
					</InspectorControls>
					{ isSelected && (
						<URLPopover
							position={ popPosition }
							renderSettings={ () => (
								<ToggleControl
									label={ __( 'Open in New Tab' ) }
									checked={ linkTarget === '_blank' }
									onChange={ this.setLinkTarget }
								/>
							) }
						>
							<form
								className="block-library-button__inline-link"
								onSubmit={ ( event ) => event.preventDefault() }
							>
								<URLInput
									value={ url }
									onChange={ ( value ) => setAttributes( { url: value } ) }
								/>
								<IconButton
									icon="editor-break"
									label={ __( 'Apply' ) }
									type="submit"
								/>
							</form>
						</URLPopover>
					) }
				</div>
			</Fragment>
		);
	}
}

export default compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
	applyFallbackStyles,
] )( ButtonEdit );
