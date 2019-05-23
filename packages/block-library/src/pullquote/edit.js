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
		const { colorUtils, textColor, setTextColor, setMainColor, className } = this.props;
		const isSolidColorStyle = includes( className, SOLID_COLOR_CLASS );
		const needTextColor = ! textColor.color || this.wasTextColorAutomaticallyComputed;
		const shouldSetTextColor = isSolidColorStyle && needTextColor && colorValue;

		setMainColor( colorValue );
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
		const figureStyle = isSolidColorStyle ?
			{ backgroundColor: mainColor.color } :
			{ borderColor: mainColor.color };
		const blockquoteStyle = {
			color: textColor.color,
		};
		const blockquoteClasses = textColor.color ? classnames( 'has-text-color', {
			[ textColor.class ]: textColor.class,
		} ) : undefined;
		return (
			<>
				<figure style={ figureStyle } className={ classnames(
					className, {
						[ mainColor.class ]: isSolidColorStyle && mainColor.class,
					} ) }>
					<blockquote style={ blockquoteStyle } className={ blockquoteClasses }>
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
							wrapperClassName="block-library-pullquote__content"
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
