/**
 * External dependencies
 */
import classnames from 'classnames';
import { find } from 'lodash';

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
	FontSizePicker,
	IconButton,
	PanelBody,
	RangeControl,
	ToggleControl,
	Toolbar,
	withFallbackStyles,
} from '@wordpress/components';
import {
	withColors,
	PostTypeSupportCheck,
	AlignmentToolbar,
	BlockControls,
	ContrastChecker,
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
// import '../../core-blocks/cover-image/editor.scss';
import './editor.scss';

const { getComputedStyle } = window;

const FallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor, fontSize, customFontSize } = ownProps.attributes;
	const editableNode = node.querySelector( '[contenteditable="true"]' );
	//verify if editableNode is available, before using getComputedStyle.
	const computedStyles = editableNode ? getComputedStyle( editableNode ) : null;
	return {
		fallbackBackgroundColor: backgroundColor || ! computedStyles ? undefined : computedStyles.backgroundColor,
		fallbackTextColor: textColor || ! computedStyles ? undefined : computedStyles.color,
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

class PostEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.toggleParallax = this.toggleParallax.bind( this );
		this.setDimRatio = this.setDimRatio.bind( this );
		this.toggleDropCap = this.toggleDropCap.bind( this );
		this.getFontSize = this.getFontSize.bind( this );
		this.setFontSize = this.setFontSize.bind( this );
	}

	onSelectImage( media ) {
		this.props.setAttributes( {
			url: media.url,
			id: media.id,
		} );
	}

	toggleParallax() {
		this.props.setAttributes( { hasParallax: ! this.props.attributes.hasParallax } );
	}

	setDimRatio( ratio ) {
		this.props.setAttributes( { dimRatio: ratio } );
	}

	toggleDropCap() {
		const { attributes, setAttributes } = this.props;
		setAttributes( { dropCap: ! attributes.dropCap } );
	}

	getDropCapHelp( checked ) {
		return checked ? __( 'Showing large initial letter.' ) : __( 'Toggle to show a large initial letter.' );
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

	componentWillReceiveProps( { image, url } ) {
		if ( image && ! url ) {
			this.props.setAttributes( {
				url: image.source_url,
			} );
		}
	}

	render() {
		const {
			attributes,
			setAttributes,
			className,
			backgroundColor,
			textColor,
			setBackgroundColor,
			setTextColor,
			fallbackBackgroundColor,
			fallbackTextColor,
			fallbackFontSize,
		} = this.props;

		const {
			url,
			title,
			id,
			hasParallax,
			dimRatio,
			textAlign,
			dropCap,
			placeholder,
		} = attributes;

		const imageStyle = backgroundImageStyles( url );
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
					<AlignmentToolbar
						value={ textAlign }
						onChange={ ( nextAlign ) => {
							setAttributes( { textAlign: nextAlign } );
						} }
					/>
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
				</BlockControls>
				<InspectorControls>
					{ !! url && (
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
					) }
					<PanelBody title={ __( 'Text Settings' ) } className="blocks-font-size">
						<FontSizePicker
							fontSizes={ FONT_SIZES }
							fallbackFontSize={ fallbackFontSize }
							value={ fontSize }
							onChange={ this.setFontSize }
						/>
						<ToggleControl
							label={ __( 'Drop Cap' ) }
							checked={ !! dropCap }
							onChange={ this.toggleDropCap }
							help={ this.getDropCapHelp }
						/>
					</PanelBody>
					<PanelColor
						colorValue={ backgroundColor.value }
						initialOpen={ false }
						title={ __( 'Background Color' ) }
						onChange={ setBackgroundColor }
					/>
					<PanelColor
						colorValue={ textColor.value }
						initialOpen={ false }
						title={ __( 'Text Color' ) }
						onChange={ setTextColor }
					/>
					<ContrastChecker
						textColor={ textColor.value }
						backgroundColor={ backgroundColor.value }
						{ ...{
							fallbackBackgroundColor,
							fallbackTextColor,
						} }
						isLargeText={ fontSize >= 18 }
					/>
				</InspectorControls>
			</Fragment>
		);

		const richText = (
			<RichText
				tagName="p"
				className={ classnames( 'wp-block-paragraph', {
					'has-background': backgroundColor.value,
					'has-drop-cap': dropCap,
					[ backgroundColor.class ]: backgroundColor.class,
					[ textColor.class ]: textColor.class,
				} ) }
				style={ {
					backgroundColor: backgroundColor.class ? undefined : backgroundColor.value,
					color: textColor.class ? undefined : textColor.value,
					fontSize: fontSize ? fontSize + 'px' : undefined,
					textAlign,
				} }
				value={ title }
				onChange={ ( nextContent ) => {
					setAttributes( {
						title: nextContent,
					} );
				} }
				placeholder={ placeholder || __( 'Add text or type' ) }
				inlineToolbar
			/>
		);

		if ( ! url ) {
			return (
				<div className={ className }>
					{ controls }
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
					{ richText }
				</div>
			);
		}

		return (
			<div className={ className }>
				{ controls }
				<div
					data-url={ url }
					style={ imageStyle }
					className={ imageClasses }
				></div>
				{ richText }
			</div>
		);
	}
}

export default compose(
	withSelect( ( select, props ) => {
		const { getMedia } = select( 'core' );
		const { id } = props.attributes;

		return {
			image: id ? getMedia( id ) : null,
		};
	} ),
	withColors( ( getColor, setColor, { attributes } ) => {
		return {
			backgroundColor: getColor( attributes.backgroundColor, attributes.customBackgroundColor, 'background-color' ),
			setBackgroundColor: setColor( 'backgroundColor', 'customBackgroundColor' ),
			textColor: getColor( attributes.textColor, attributes.customTextColor, 'color' ),
			setTextColor: setColor( 'textColor', 'customTextColor' ),
		};
	} ),
	FallbackStyles,
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
