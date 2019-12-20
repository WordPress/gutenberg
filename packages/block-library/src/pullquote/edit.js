/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	RichText,
	ContrastChecker,
	InspectorControls,
	withColors,
	PanelColorSettings,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { SOLID_COLOR_CLASS } from './shared';

class PullQuoteEdit extends Component {
	constructor( props ) {
		super( props );

		this.wasTextColorAutomaticallyComputed = false;
		this.pullQuoteMainColorSetter = this.pullQuoteMainColorSetter.bind( this );
		this.pullQuoteTextColorSetter = this.pullQuoteTextColorSetter.bind( this );
	}

	pullQuoteMainColorSetter( colorValue ) {
		const { colorUtils, textColor, setAttributes, setTextColor, setMainColor, className } = this.props;
		const isSolidColorStyle = includes( className, SOLID_COLOR_CLASS );
		const needTextColor = ! textColor.color || this.wasTextColorAutomaticallyComputed;
		const shouldSetTextColor = isSolidColorStyle && needTextColor && colorValue;

		if ( isSolidColorStyle ) {
			// If we use the solid color style, set the color using the normal mechanism.
			setMainColor( colorValue );
		} else {
			// If we use the default style, set the color as a custom color to force the usage of an inline style.
			// Default style uses a border color for which classes are not available.
			setAttributes( { customMainColor: colorValue } );
		}

		if ( shouldSetTextColor ) {
			this.wasTextColorAutomaticallyComputed = true;
			setTextColor( colorUtils.getMostReadableColor( colorValue ) );
		}
	}

	pullQuoteTextColorSetter( colorValue ) {
		const { setTextColor } = this.props;
		setTextColor( colorValue );
		this.wasTextColorAutomaticallyComputed = false;
	}

	componentDidUpdate( prevProps ) {
		const {
			attributes,
			className,
			mainColor,
			setAttributes,
		} = this.props;
		// If the block includes a named color and we switched from the
		// solid color style to the default style.
		if ( attributes.mainColor && ! includes( className, SOLID_COLOR_CLASS ) && includes( prevProps.className, SOLID_COLOR_CLASS ) ) {
			// Remove the named color, and set the color as a custom color.
			// This is done because named colors use classes, in the default style we use a border color,
			// and themes don't set classes for border colors.
			setAttributes( { mainColor: undefined, customMainColor: mainColor.color } );
		}
	}

	render() {
		const {
			attributes,
			mainColor,
			textColor,
			setAttributes,
			isSelected,
			className,
		} = this.props;

		const { value, citation } = attributes;

		const isSolidColorStyle = includes( className, SOLID_COLOR_CLASS );
		const figureStyles = isSolidColorStyle ?
			{ backgroundColor: mainColor.color } :
			{ borderColor: mainColor.color };

		const figureClasses = classnames( className, {
			'has-background': isSolidColorStyle && mainColor.color,
			[ mainColor.class ]: isSolidColorStyle && mainColor.class,
		} );

		const blockquoteStyles = {
			color: textColor.color,
		};

		const blockquoteClasses = textColor.color && classnames(
			'has-text-color',
			{ [ textColor.class ]: textColor.class }
		);

		return (
			<>
				<figure style={ figureStyles } className={ figureClasses }>
					<blockquote style={ blockquoteStyles } className={ blockquoteClasses }>
						<RichText
							multiline
							value={ value }
							onChange={
								( nextValue ) => setAttributes( {
									value: nextValue,
								} )
							}
							placeholder={
								// translators: placeholder text used for the quote
								__( 'Write quote…' )
							}
						/>
						{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
							<RichText
								value={ citation }
								placeholder={
									// translators: placeholder text used for the citation
									__( 'Write citation…' )
								}
								onChange={
									( nextCitation ) => setAttributes( {
										citation: nextCitation,
									} )
								}
								className="wp-block-pullquote__citation"
							/>
						) }
					</blockquote>
				</figure>
				<InspectorControls>
					<PanelColorSettings
						title={ __( 'Color Settings' ) }
						colorSettings={ [
							{
								value: mainColor.color,
								onChange: this.pullQuoteMainColorSetter,
								label: __( 'Main Color' ),
							},
							{
								value: textColor.color,
								onChange: this.pullQuoteTextColorSetter,
								label: __( 'Text Color' ),
							},
						] }
					>
						{ isSolidColorStyle && (
							<ContrastChecker
								{ ...{
									textColor: textColor.color,
									backgroundColor: mainColor.color,
								} }
								isLargeText={ false }
							/>
						) }
					</PanelColorSettings>
				</InspectorControls>
			</>
		);
	}
}

export default withColors( { mainColor: 'background-color', textColor: 'color' } )(
	PullQuoteEdit
);
