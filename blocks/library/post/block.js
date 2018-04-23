/**
 * External dependencies
 */
import classnames from 'classnames';
import { findKey, map, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { PostTypeSupportCheck } from '@wordpress/editor';
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

class PostBlock extends Component {
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
		const { post } = nextProps;

		// Only update post properties if a new post is returned
		if ( this.props.post !== nextProps.post ) {
			if ( post && post.data ) {
				setAttributes( {
					title: [ get( post.data, 'title.rendered' ) ],
					url: post.data.image_url,
					postId: '', // reset postId
				} );
			}
		}
	}

	render() {
		const { attributes, setAttributes, isSelected, className } = this.props;
		const { url, title, textAlign, id, hasParallax, dimRatio, textColor, backgroundColor, postId } = attributes;

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
				<Toolbar>
					<PostTypeSupportCheck supportKeys="media-library">
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
					</PostTypeSupportCheck>
				</Toolbar>
			</BlockControls>,
			<InspectorControls key="inspector">
				<PanelBody title={ __( 'Post Settings' ) }>
					<TextControl
						label={ __( 'ID' ) }
						value={ postId }
						onChange={ ( idValue ) => setAttributes( { postId: idValue } ) }
					>
					</TextControl>
				</PanelBody>

				<PanelBody title={ __( 'Post Image Settings' ) }>
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
			const label = __( 'Post image' );

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
	const { postId } = props.attributes;

	if ( postId ) {
		return {
			post: `/wp/v2/posts/${ postId }`,
		};
	}
} )( PostBlock );

export function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}
