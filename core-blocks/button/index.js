/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import {
	Dashicon,
	IconButton,
	PanelBody,
	PanelColor,
	ToggleControl,
	withFallbackStyles,
} from '@wordpress/components';
import {
	UrlInput,
	RichText,
	BlockControls,
	BlockAlignmentToolbar,
	ColorPalette,
	ContrastChecker,
	InspectorControls,
	getColorClass,
	withColors,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';

const { getComputedStyle } = window;

const ContrastCheckerWithFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor } = ownProps;
	//avoid the use of querySelector if textColor color is known and verify if node is available.
	const textNode = ! textColor && node ? node.querySelector( '[contenteditable="true"]' ) : null;
	return {
		fallbackBackgroundColor: backgroundColor || ! node ? undefined : getComputedStyle( node ).backgroundColor,
		fallbackTextColor: textColor || ! textNode ? undefined : getComputedStyle( textNode ).color,
	};
} )( ContrastChecker );

class ButtonBlock extends Component {
	constructor() {
		super( ...arguments );
		this.nodeRef = null;
		this.bindRef = this.bindRef.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.toggleClear = this.toggleClear.bind( this );
	}

	updateAlignment( nextAlign ) {
		this.props.setAttributes( { align: nextAlign } );
	}

	toggleClear() {
		const { attributes, setAttributes } = this.props;
		setAttributes( { clear: ! attributes.clear } );
	}

	bindRef( node ) {
		if ( ! node ) {
			return;
		}
		this.nodeRef = node;
	}

	render() {
		const {
			attributes,
			backgroundColor,
			textColor,
			setBackgroundColor,
			setTextColor,
			setAttributes,
			isSelected,
			className,
		} = this.props;

		const {
			text,
			url,
			title,
			align,
			clear,
		} = attributes;

		return (
			<Fragment>
				<BlockControls>
					<BlockAlignmentToolbar value={ align } onChange={ this.updateAlignment } />
				</BlockControls>
				<span className={ className } title={ title } ref={ this.bindRef }>
					<RichText
						tagName="span"
						placeholder={ __( 'Add text…' ) }
						value={ text }
						onChange={ ( value ) => setAttributes( { text: value } ) }
						formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
						className={ classnames(
							'wp-block-button__link', {
								'has-background': backgroundColor.value,
								[ backgroundColor.class ]: backgroundColor.class,
								'has-text-color': textColor.value,
								[ textColor.class ]: textColor.class,
							}
						) }
						style={ {
							backgroundColor: backgroundColor.class ? undefined : backgroundColor.value,
							color: textColor.class ? undefined : textColor.value,
						} }
						keepPlaceholderOnFocus
					/>
					<InspectorControls>
						<PanelBody>
							<ToggleControl
								label={ __( 'Wrap text' ) }
								checked={ !! clear }
								onChange={ this.toggleClear }
							/>
							<PanelColor title={ __( 'Background Color' ) } colorValue={ backgroundColor.value } >
								<ColorPalette
									value={ backgroundColor.value }
									onChange={ setBackgroundColor }
								/>
							</PanelColor>
							<PanelColor title={ __( 'Text Color' ) } colorValue={ textColor.value } >
								<ColorPalette
									value={ textColor.value }
									onChange={ setTextColor }
								/>
							</PanelColor>
							{ this.nodeRef && <ContrastCheckerWithFallbackStyles
								node={ this.nodeRef }
								textColor={ textColor.value }
								backgroundColor={ backgroundColor.value }
								isLargeText={ true }
							/> }
						</PanelBody>
					</InspectorControls>
				</span>
				{ isSelected && (
					<form
						className="blocks-button__inline-link"
						onSubmit={ ( event ) => event.preventDefault() }>
						<Dashicon icon="admin-links" />
						<UrlInput
							value={ url }
							onChange={ ( value ) => setAttributes( { url: value } ) }
						/>
						<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
					</form>
				) }
			</Fragment>
		);
	}
}

const blockAttributes = {
	url: {
		type: 'string',
		source: 'attribute',
		selector: 'a',
		attribute: 'href',
	},
	title: {
		type: 'string',
		source: 'attribute',
		selector: 'a',
		attribute: 'title',
	},
	text: {
		type: 'array',
		source: 'children',
		selector: 'a',
	},
	align: {
		type: 'string',
		default: 'none',
	},
	backgroundColor: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
};

export const name = 'core/button';

const colorsMigration = ( attributes ) => {
	return omit( {
		...attributes,
		customTextColor: attributes.textColor && '#' === attributes.textColor[ 0 ] ? attributes.textColor : undefined,
		customBackgroundColor: attributes.color && '#' === attributes.color[ 0 ] ? attributes.color : undefined,
	}, [ 'color', 'textColor' ] );
};

export const settings = {
	title: __( 'Button' ),

	description: __( 'A nice little button. Call something out with it.' ),

	icon: 'button',

	category: 'layout',

	attributes: blockAttributes,

	getEditWrapperProps( attributes ) {
		const { align, clear } = attributes;
		const props = { 'data-resized': true };

		if ( 'left' === align || 'right' === align || 'center' === align ) {
			props[ 'data-align' ] = align;
		}

		if ( clear ) {
			props[ 'data-clear' ] = 'true';
		}

		return props;
	},

	edit: withColors( ( getColor, setColor, { attributes, setAttributes } ) => {
		return {
			backgroundColor: getColor( attributes.backgroundColor, attributes.customBackgroundColor, 'background-color' ),
			setBackgroundColor: setColor( 'backgroundColor', 'customBackgroundColor', setAttributes ),
			textColor: getColor( attributes.textColor, attributes.customTextColor, 'color' ),
			setTextColor: setColor( 'textColor', 'customTextColor', setAttributes ),
		};
	} )( ButtonBlock ),

	save( { attributes } ) {
		const {
			url,
			text,
			title,
			align,
			backgroundColor,
			textColor,
			customBackgroundColor,
			customTextColor,
		} = attributes;

		const textClass = getColorClass( 'color', textColor );
		const backgroundClass = getColorClass( 'background-color', backgroundColor );

		const buttonClasses = classnames( 'wp-block-button__link', {
			'has-text-color': textColor || customTextColor,
			[ textClass ]: textClass,
			'has-background': backgroundColor || customBackgroundColor,
			[ backgroundClass ]: backgroundClass,
		} );

		const buttonStyle = {
			backgroundColor: backgroundClass ? undefined : customBackgroundColor,
			color: textClass ? undefined : customTextColor,
		};

		return (
			<div className={ `align${ align }` }>
				<RichText.Content
					tagName="a"
					className={ buttonClasses }
					href={ url }
					title={ title }
					style={ buttonStyle }
					value={ text }
				/>
			</div>
		);
	},

	deprecated: [ {
		attributes: {
			...pick( blockAttributes, [ 'url', 'title', 'text', 'align' ] ),
			color: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
		},

		save( { attributes } ) {
			const { url, text, title, align, color, textColor } = attributes;

			const buttonStyle = {
				backgroundColor: color,
				color: textColor,
			};

			const linkClass = 'wp-block-button__link';

			return (
				<div className={ `align${ align }` }>
					<RichText.Content
						tagName="a"
						className={ linkClass }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
					/>
				</div>
			);
		},
		migrate: colorsMigration,
	},
	{
		attributes: {
			...pick( blockAttributes, [ 'url', 'title', 'text', 'align' ] ),
			color: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
		},

		save( { attributes } ) {
			const { url, text, title, align, color, textColor } = attributes;

			return (
				<div className={ `align${ align }` } style={ { backgroundColor: color } }>
					<RichText.Content
						tagName="a"
						href={ url }
						title={ title }
						style={ { color: textColor } }
						value={ text }
					/>
				</div>
			);
		},
		migrate: colorsMigration,
	},
	],
};
