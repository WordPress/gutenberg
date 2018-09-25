/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Component,
	Fragment,
} from '@wordpress/element';
import {
	RichText,
	ContrastChecker,
	InspectorControls,
	withColors,
	PanelColorSettings,
} from '@wordpress/editor';

export const SOLID_COLOR_STYLE_NAME = 'solid-color';
export const SOLID_COLOR_CLASS = `is-style-${ SOLID_COLOR_STYLE_NAME }`;

export const toRichTextValue = ( value ) => map( value, ( ( subValue ) => subValue.children ) );
export const fromRichTextValue = ( value ) => map( value, ( subValue ) => ( {
	children: subValue,
} ) );

class PullQuoteEdit extends Component {
	constructor( props ) {
		super( props );

		this.wasTextColorAutomaticallyComputed = false;
		this.pullQuoteMainColorSetter = this.pullQuoteMainColorSetter.bind( this );
		this.pullQuoteTextColorSetter = this.pullQuoteTextColorSetter.bind( this );
	}

	pullQuoteMainColorSetter( colorValue ) {
		const { colorUtils, textColor, setTextColor, setMainColor } = this.props;
		setMainColor( colorValue );
		if ( ! textColor.color || this.wasTextColorAutomaticallyComputed ) {
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
			<Fragment>
				<figure style={ figureStyle } className={ classnames(
					className, {
						[ mainColor.class ]: isSolidColorStyle && mainColor.class,
					} ) }>
					<blockquote style={ blockquoteStyle } className={ blockquoteClasses }>
						<RichText
							multiline="p"
							value={ toRichTextValue( value ) }
							onChange={
								( nextValue ) => setAttributes( {
									value: fromRichTextValue( nextValue ),
								} )
							}
							/* translators: the text of the quotation */
							placeholder={ __( 'Write quote…' ) }
							wrapperClassName="block-library-pullquote__content"
						/>
						{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
							<RichText
								value={ citation }
								/* translators: the individual or entity quoted */
								placeholder={ __( 'Write citation…' ) }
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
			</Fragment>
		);
	}
}

export default withColors( { mainColor: 'background-color', textColor: 'color' } )(
	PullQuoteEdit
);
