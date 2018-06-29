/**
 * External dependencies
 */
import classnames from 'classnames';
import { isUndefined, pickBy, find, map } from 'lodash';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Component,
	Fragment,
	compose,
} from '@wordpress/element';
import {
	ButtonGroup,
	Button,
	CategorySelect,
	FontSizePicker,
	IconButton,
	PanelBody,
	RangeControl,
	TextControl,
	ToggleControl,
	Toolbar,
	withFallbackStyles,
	withAPIData,
} from '@wordpress/components';
import {
	withColors,
	PostTypeSupportCheck,
	BlockControls,
	MediaPlaceholder,
	InspectorControls,
	MediaUpload,
	PanelColor,
	RichText,
} from '@wordpress/editor';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './editor.scss';

const { getComputedStyle } = window;

const FallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { fontSize, customFontSize } = ownProps.attributes;
	const editableNode = node.querySelector( '[contenteditable="true"]' );
	//verify if editableNode is available, before using getComputedStyle.
	const computedStyles = editableNode ? getComputedStyle( editableNode ) : null;
	return {
		fallbackFontSize: fontSize || customFontSize || ! computedStyles ? undefined : parseInt( computedStyles.fontSize ) || undefined,
	};
} );

const FONT_SIZES = [
	{
		name: 'small',
		shortName: 'S',
		size: 14,
	},
	{
		name: 'regular',
		shortName: 'M',
		size: 16,
	},
	{
		name: 'large',
		shortName: 'L',
		size: 36,
	},
	{
		name: 'larger',
		shortName: 'XL',
		size: 48,
	},
];

const POST_TYPES = [
	{
		name: __( 'Auto' ),
		slug: 'auto',
	},
	{
		name: __( 'With id' ),
		slug: 'withid',
	},
	{
		name: __( 'Static' ),
		slug: 'static',
	},
];

class PostEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.toggleImage = this.toggleImage.bind( this );
		this.toggleParallax = this.toggleParallax.bind( this );
		this.getFontSize = this.getFontSize.bind( this );
		this.setFontSize = this.setFontSize.bind( this );
	}

	onSelectImage( media ) {
		this.props.setAttributes( {
			mediaUrl: media.url,
			mediaId: media.id,
		} );
	}

	toggleImage() {
		this.props.setAttributes( { hasImage: ! this.props.attributes.hasImage } );
	}

	toggleParallax() {
		this.props.setAttributes( { hasParallax: ! this.props.attributes.hasParallax } );
	}

	getFontSize() {
		const { customFontSize, fontSize } = this.props.attributes;
		if ( fontSize ) {
			const fontSizeObj = find( FONT_SIZES, { name: fontSize } );
			if ( fontSizeObj ) {
				return fontSizeObj.size;
			}
		}

		if ( customFontSize ) {
			return customFontSize;
		}
	}

	setFontSize( fontSizeValue ) {
		const { setAttributes } = this.props;
		const thresholdFontSize = find( FONT_SIZES, { size: fontSizeValue } );
		if ( thresholdFontSize ) {
			setAttributes( {
				fontSize: thresholdFontSize.name,
				customFontSize: undefined,
			} );
			return;
		}
		setAttributes( {
			fontSize: undefined,
			customFontSize: fontSizeValue,
		} );
	}

	componentDidUpdate( prevProps ) {
		const { post, media, postResults, setAttributes } = this.props;
		const { type } = this.props.attributes;

		const attributes = {};

		if ( type === 'withid' && post && post !== prevProps.post ) {
			attributes.title = [ post.title.rendered ];
			attributes.link = post.link;
			attributes.mediaId = post.featured_media;
		}

		if ( type === 'auto' && postResults && postResults !== prevProps.postResults && postResults.data ) {
			const postRes = postResults.data[ 0 ];

			attributes.id = parseInt( postRes.id );
			attributes.title = [ postRes.title.rendered ];
			attributes.link = postRes.link;
			attributes.mediaId = postRes.featured_media;
		}

		if ( media && media !== prevProps.media ) {
			attributes.mediaUrl = media.source_url;
		}

		if ( attributes ) {
			setAttributes( attributes );
		}
	}

	render() {
		const {
			attributes,
			setAttributes,
			className,
			textColor,
			setTextColor,
			fallbackFontSize,
			categories,
		} = this.props;

		const {
			id,
			title,
			mediaUrl,
			mediaId,
			type,
			categoryId,
			hasImage,
			hasParallax,
			dimRatio,
			placeholder,
		} = attributes;

		const imageStyle = backgroundImageStyles( mediaUrl );
		const imageClasses = classnames(
			'wp-block-cover-image',
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		const fontSize = this.getFontSize();

		const controls = (
			<Fragment>
				<BlockControls>
					<Toolbar>
						<PostTypeSupportCheck supportKeys="media-library">
							<MediaUpload
								onSelect={ this.onSelectImage }
								type="image"
								value={ mediaId }
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
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Post Settings' ) }>
						<div className="components-post-type-picker__buttons">
							<ButtonGroup aria-label={ __( 'Column width' ) }>
								{
									map( POST_TYPES, ( { name, slug } ) => {
										return (
											<Button
												key={ slug }
												isLarge
												isPrimary={ type === slug }
												aria-pressed={ type === slug }
												onClick={ ( ) => {
													setAttributes( { type: slug } );
												} }
											>
												{ name }
											</Button>
										);
									} )
								}
							</ButtonGroup>
						</div>
						{
							( type === 'withid' ) &&
							<TextControl
								placeholder={ __( 'Post id' ) }
								value={ id }
								onChange={ ( nextId ) => {
									setAttributes( { id: parseInt( nextId ) } );
								} }
							/>
						}

						{
							type === 'auto' &&
							<CategorySelect
								key="query-controls-category-select"
								categoriesList={ categories }
								label={ __( 'Last from (category)' ) }
								noOptionLabel={ __( 'All' ) }
								selectedCategoryId={ categoryId }
								onChange={ ( nextCategory ) => {
									setAttributes( { categoryId: nextCategory } );
								} }
							/>
						}
					</PanelBody>
					<PanelBody title={ __( 'Image Settings' ) }>
						<ToggleControl
							label={ __( 'Show image' ) }
							checked={ !! hasImage }
							onChange={ this.toggleImage }
						/>
						{ !! mediaUrl && hasImage && (
							<Fragment>
								<ToggleControl
									label={ __( 'Fixed Background' ) }
									checked={ !! hasParallax }
									onChange={ this.toggleParallax }
								/>
								<RangeControl
									label={ __( 'Background Dimness' ) }
									value={ dimRatio }
									onChange={ ( ratio ) => {
										setAttributes( { dimRatio: ratio } );
									} }
									min={ 0 }
									max={ 100 }
									step={ 10 }
								/>
							</Fragment>
						) }
					</PanelBody>
					<PanelBody title={ __( 'Text Settings' ) } className="blocks-font-size">
						<FontSizePicker
							fontSizes={ FONT_SIZES }
							fallbackFontSize={ fallbackFontSize }
							value={ fontSize }
							onChange={ this.setFontSize }
						/>
					</PanelBody>
					<PanelColor
						colorValue={ textColor.value }
						initialOpen={ false }
						title={ __( 'Text Color' ) }
						onChange={ setTextColor }
					/>
				</InspectorControls>
			</Fragment>
		);

		const richText = (
			<RichText
				tagName="p"
				className={ classnames( 'wp-block-paragraph', {
					[ textColor.class ]: textColor.class,
				} ) }
				style={ {
					color: textColor.class ? undefined : textColor.value,
					fontSize: fontSize ? fontSize + 'px' : undefined,
				} }
				value={ title }
				onChange={ ( value ) => {
					setAttributes( {
						title: value,
						type: 'static',
					} );
				} }
				placeholder={ placeholder || __( 'Add text or type' ) }
				formattingControls={ [ 'bold', 'italic' ] }
				inlineToolbar
			/>
		);

		if ( ! mediaUrl ) {
			return (
				<div className={ className }>
					{ controls }
					{ hasImage &&
						<MediaPlaceholder
							icon="format-image"
							labels={ {
								title: __( 'Post image' ),
								name: __( 'an image' ),
							} }
							onSelect={ this.onSelectImage }
							accept="image/*"
							type="image"
						/>
					}
					{ richText }
				</div>
			);
		}

		return (
			<div className={ className }>
				{ controls }
				{ hasImage &&
					<div
						data-url={ mediaUrl }
						style={ imageStyle }
						className={ imageClasses }
					></div>
				}
				{ richText }
			</div>
		);
	}
}

export default compose(
	withSelect( ( select, props ) => {
		const { getMedia, getCategories, getEntityRecord } = select( 'core' );
		const { attributes } = props;

		const res = {};

		switch ( attributes.type ) {
			case 'auto':
				res.categories = getCategories();
				break;
			case 'withid':
				if ( attributes.id ) {
					res.post = getEntityRecord( 'postType', 'post', attributes.id );

					if ( res.post ) {
						attributes.mediaId = res.post.featured_media;
					}
				}
				break;
		}

		if ( attributes.mediaId ) {
			res.media = getMedia( attributes.mediaId );
		}

		return res;
	} ),
	withColors( { textColor: 'color' } ),
	FallbackStyles,
	withAPIData( ( props ) => {
		if ( props.attributes.type === 'auto' ) {
			const postQuery = stringify( pickBy( {
				category_id: props.attributes.categoryId,
				order: 'desc',
				orderby: 'date',
				per_page: 1,
			}, ( value ) => ! isUndefined( value ) ) );

			return {
				postResults: `/wp/v2/posts?${ postQuery }`,
			};
		}

		return {
			postResults: null,
		};
	} ),
)( PostEdit );

export function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}

export function backgroundImageStyles( url ) {
	return url ?
		{ backgroundImage: `url(${ url })` } :
		undefined;
}
