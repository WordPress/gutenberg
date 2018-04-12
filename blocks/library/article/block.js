/**
 * External dependencies
 */
import classnames from 'classnames';
import { findKey, map, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	Button,
	ButtonGroup,
	IconButton,
	PanelBody,
	PanelColor,
	RangeControl,
	TextControl,
	ToggleControl,
	Toolbar,
	withAPIData,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	AlignmentToolbar,
	BlockControls,
	ColorPalette,
	ImagePlaceholder,
	InspectorControls,
	MediaUpload,
	RichText,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';

export const FONT_SIZES = {
	small: 14,
	regular: 16,
	large: 36,
	larger: 48,
};

class ArticleBlock extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.toggleParallax = this.toggleParallax.bind( this );
		this.setDimRatio = this.setDimRatio.bind( this );
		this.setFontSize = this.setFontSize.bind( this );
		this.getFontSize = this.getFontSize.bind( this );
		this.setTitle = this.setTitle.bind( this );
	}

	onSelectImage( media ) {
		const { setAttributes } = this.props;

		setAttributes( {
			url: media.url,
			id: media.id,
		} );
	}

	toggleParallax() {
		const { attributes, setAttributes } = this.props;
		const { hasParallax } = attributes;

		setAttributes( { hasParallax: ! hasParallax } );
	}

	setDimRatio( ratio ) {
		const { setAttributes } = this.props;

		setAttributes( { dimRatio: ratio } );
	}

	setFontSize( fontSizeValue ) {
		const { setAttributes } = this.props;

		const thresholdFontSize = findKey( FONT_SIZES, ( size ) => size === fontSizeValue );

		if ( thresholdFontSize ) {
			setAttributes( {
				fontSize: thresholdFontSize,
				customFontSize: undefined,
			} );
			return;
		}

		setAttributes( {
			fontSize: undefined,
			customFontSize: fontSizeValue,
		} );
	}

	getFontSize() {
		const { attributes } = this.props;
		const { fontSize, customFontSize } = attributes;

		if ( fontSize ) {
			return FONT_SIZES[ fontSize ];
		}

		if ( customFontSize ) {
			return customFontSize;
		}
	}

	setTitle( value ) {
		const { setAttributes } = this.props;

		setAttributes( { title: value } );
	}

	componentWillReceiveProps( nextProps ) {
		const { setAttributes } = this.props;
		const { article } = nextProps;

		// Only update article properties if a new article is returned
		if ( this.props.article !== nextProps.article ) {
			if ( article && article.data ) {
				setAttributes( {
					title: [ get( article.data, 'title.rendered' ) ],
					url: article.data.image_url,
					articleId: '', // reset articleId
				} );
			}
		}
	}

	render() {
		const { attributes, setAttributes, isSelected, className } = this.props;
		const { url, title, textAlign, id, hasParallax, dimRatio, textColor, backgroundColor, articleId } = attributes;

		const fontSize = this.getFontSize();
		const style = url ? { backgroundImage: `url(${ url })` } : undefined;

		const classes = classnames(
			'wp-block-cover-image',
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		const alignmentToolbar = (
			<AlignmentToolbar
				value={ textAlign }
				onChange={ ( nextAlign ) => {
					setAttributes( { textAlign: nextAlign } );
				} }
			/>
		);

		const controls = isSelected && [
			<BlockControls key="controls">
				{ alignmentToolbar }
				{ ! get( window, 'customGutenberg.editor.noMediaLibrary' ) &&
					<Toolbar>
						<MediaUpload
							onSelect={ this.onSelectImage }
							type="image"
							value={ id }
							render={ ( { open } ) => (
								<IconButton
									className="components-toolbar__control"
									label={ __( 'Edit image' ) }
									icon="edit"
									onClick={ open }
								/>
							) }
						/>
					</Toolbar>
				}
			</BlockControls>,
			<InspectorControls key="inspector">
				<PanelBody title={ __( 'Article Settings' ) }>
					<TextControl
						label={ __( 'ID' ) }
						value={ articleId }
						onChange={ ( idValue ) => setAttributes( { articleId: idValue } ) }
					>
					</TextControl>
				</PanelBody>

				<PanelBody title={ __( 'Article Image Settings' ) }>
					<ToggleControl
						label={ __( 'Fixed Background' ) }
						checked={ !! hasParallax }
						onChange={ this.toggleParallax }
					/>
					<RangeControl
						label={ __( 'Background Dimness' ) }
						value={ dimRatio }
						onChange={ this.setDimRatio }
						min={ 0 }
						max={ 100 }
						step={ 10 }
					/>
				</PanelBody>

				<PanelBody title={ __( 'Text Settings' ) }>
					<div className="blocks-font-size__main">
						<ButtonGroup aria-label={ __( 'Font Size' ) }>
							{ map( {
								S: 'small',
								M: 'regular',
								L: 'large',
								XL: 'larger',
							}, ( size, label ) => (
								<Button
									key={ label }
									isLarge
									isPrimary={ fontSize === FONT_SIZES[ size ] }
									aria-pressed={ fontSize === FONT_SIZES[ size ] }
									onClick={ () => this.setFontSize( FONT_SIZES[ size ] ) }
								>
									{ label }
								</Button>
							) ) }
						</ButtonGroup>
						<Button
							isLarge
							onClick={ () => this.setFontSize( undefined ) }
						>
							{ __( 'Reset' ) }
						</Button>
					</div>
					<RangeControl
						label={ __( 'Custom Size' ) }
						value={ fontSize || '' }
						onChange={ ( value ) => this.setFontSize( value ) }
						min={ 12 }
						max={ 100 }
						beforeIcon="editor-textcolor"
						afterIcon="editor-textcolor"
					/>
					{ alignmentToolbar }
				</PanelBody>

				<PanelColor title={ __( 'Background Color' ) } colorValue={ backgroundColor } initialOpen={ false }>
					<ColorPalette
						value={ backgroundColor }
						onChange={ ( colorValue ) => setAttributes( { backgroundColor: colorValue } ) }
					/>
				</PanelColor>

				<PanelColor title={ __( 'Text Color' ) } colorValue={ textColor } initialOpen={ false }>
					<ColorPalette
						value={ textColor }
						onChange={ ( colorValue ) => setAttributes( { textColor: colorValue } ) }
					/>
				</PanelColor>
			</InspectorControls>,
		];

		const richText = (
			<RichText
				key="title"
				tagName="p"
				placeholder={ __( 'Write a title…' ) }
				value={ title }
				className={ classnames(
					'wp-block-paragraph',
					className,
					{ 'has-background': backgroundColor },
				) }
				style={ {
					backgroundColor: backgroundColor,
					color: textColor,
					fontSize: fontSize ? fontSize + 'px' : undefined,
					textAlign: textAlign,
				} }
				onChange={ this.setTitle }
				isSelected={ isSelected }
				inlineToolbar
			/>
		);

		if ( ! url ) {
			const icon = 'format-image';
			const label = __( 'Article image' );

			return [
				controls,
				<ImagePlaceholder
					key="cover-image-placeholder"
					{ ...{ className, icon, label, onSelectImage: this.onSelectImage } }
				/>,
				richText,
			];
		}

		return [
			controls,
			<section
				key="preview"
				data-url={ url }
				style={ style }
				className={ classes }
			/>,
			( title || isSelected ? richText : null ),
		];
	}
}

export default withAPIData( ( props ) => {
	const { articleId } = props.attributes;

	if ( articleId ) {
		return {
			article: `/wp/v2/articles/${ articleId }`,
		};
	}
} )( ArticleBlock );

export function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}
