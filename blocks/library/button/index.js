/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Dashicon, IconButton, PanelColor, withFallbackStyles } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType } from '../../api';
import Editable from '../../editable';
import UrlInput from '../../url-input';
import BlockControls from '../../block-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import ColorPalette from '../../color-palette';
import ContrastChecker from '../../contrast-checker';
import InspectorControls from '../../inspector-controls';

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
			setAttributes,
			focus,
			setFocus,
			className,
		} = this.props;

		const {
			text,
			url,
			title,
			align,
			color,
			textColor,
			clear,
		} = attributes;

		return [
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar value={ align } onChange={ this.updateAlignment } />
				</BlockControls>
			),
			<span key="button" className={ className } title={ title } style={ { backgroundColor: color } } ref={ this.bindRef }>
				<Editable
					tagName="span"
					placeholder={ __( 'Add text…' ) }
					value={ text }
					focus={ focus }
					onFocus={ setFocus }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
					style={ {
						color: textColor,
					} }
					keepPlaceholderOnFocus
				/>
				{ focus &&
					<InspectorControls key="inspector">
						<ToggleControl
							label={ __( 'Stand on a line' ) }
							checked={ !! clear }
							onChange={ this.toggleClear }
						/>
						<PanelColor title={ __( 'Background Color' ) } colorValue={ color } >
							<ColorPalette
								value={ color }
								onChange={ ( colorValue ) => setAttributes( { color: colorValue } ) }
							/>
						</PanelColor>
						<PanelColor title={ __( 'Text Color' ) } colorValue={ textColor } >
							<ColorPalette
								value={ textColor }
								onChange={ ( colorValue ) => setAttributes( { textColor: colorValue } ) }
							/>
						</PanelColor>
						{ this.nodeRef && <ContrastCheckerWithFallbackStyles
							node={ this.nodeRef }
							textColor={ textColor }
							backgroundColor={ color }
							isLargeText={ true }
						/> }
					</InspectorControls>
				}
			</span>,
			focus && (
				<form
					key="form-link"
					className="blocks-button__inline-link"
					onSubmit={ ( event ) => event.preventDefault() }>
					<Dashicon icon="admin-links" />
					<UrlInput
						value={ url }
						onChange={ ( value ) => setAttributes( { url: value } ) }
					/>
					<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
				</form>
			),
		];
	}
}

registerBlockType( 'core/button', {
	title: __( 'Button' ),

	description: __( 'A nice little button. Call something out with it.' ),

	icon: 'button',

	category: 'layout',

	attributes: {
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
		color: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
	},

	getEditWrapperProps( attributes ) {
		const { align, clear } = attributes;
		const props = {};

		if ( 'left' === align || 'right' === align || 'center' === align ) {
			props[ 'data-align' ] = align;
		}

		if ( clear ) {
			props[ 'data-clear' ] = 'true';
		}

		return props;
	},

	edit: ButtonBlock,

	save( { attributes } ) {
		const { url, text, title, align, color, textColor } = attributes;

		return (
			<div className={ `align${ align }` } style={ { backgroundColor: color } }>
				<a href={ url } title={ title } style={ { color: textColor } }>
					{ text }
				</a>
			</div>
		);
	},
} );
