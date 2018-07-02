/**
 * External dependencies
 */
import classnames from 'classnames';
import { reduce } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose, Component, Fragment } from '@wordpress/element';
import {
	IconButton,
	PanelBody,
	RangeControl,
	TextControl,
	ToggleControl,
	Toolbar,
} from '@wordpress/components';
import {
	withColors,
	BlockControls,
	InnerBlocks,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	PanelColor,
	PostTypeSupportCheck,
} from '@wordpress/editor';

class SectionBlockEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.toggleImage = this.toggleImage.bind( this );
		this.toggleParallax = this.toggleParallax.bind( this );
		this.setDimRatio = this.setDimRatio.bind( this );
	}

	toggleImage() {
		this.props.setAttributes( { hasImage: ! this.props.attributes.hasImage } );
	}

	onSelectImage( media ) {
		if ( ! media || ! media.url ) {
			this.props.setAttributes( { url: undefined, id: undefined } );
			return;
		}

		this.props.setAttributes( { url: media.url, id: media.id } );

		if ( media.data ) {
			this.updateData( media.data );
		}
	}

	toggleParallax() {
		this.props.setAttributes( { hasParallax: ! this.props.attributes.hasParallax } );
	}

	setDimRatio( ratio ) {
		this.props.setAttributes( { dimRatio: ratio } );
	}

	updateData( nextData ) {
		nextData = reduce( nextData, ( result, value, key ) => {
			key = key.replace( '_', '-' );
			result[ `data-${ key }` ] = value;

			return result;
		}, {} );

		this.props.setAttributes( { data: nextData } );
	}

	render() {
		const {
			attributes,
			className,
			backgroundColor,
			setBackgroundColor,
			setAttributes,
		} = this.props;

		const {
			maxWidth,
			hasImage,
			id,
			url,
			hasParallax,
			dimRatio,
			data,
		} = attributes;

		const classes = classnames(
			className,
			hasImage ? dimRatioToClass( dimRatio ) : '',
			{
				'has-max-width': maxWidth !== '',
				'has-background-dim': hasImage && dimRatio !== 0,
				'has-parallax': hasImage && hasParallax,
				'has-background': ! hasImage && backgroundColor.value,
				[ backgroundColor.class ]: ! hasImage && backgroundColor.class,
			}
		);

		const style = hasImage ? backgroundImageStyles( url ) : {
			backgroundColor: backgroundColor.class ? undefined : backgroundColor.value,
		};
		style.maxWidth = maxWidth ? maxWidth : '';

		const controls = (
			<Fragment>
				<BlockControls>
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
					<PanelBody title={ __( 'Section Settings' ) }>
						<TextControl
							value={ maxWidth }
							label={ __( 'Width' ) }
							onChange={ ( nextValue ) => {
								setAttributes( { maxWidth: nextValue } );
							} }
						/>
						<ToggleControl
							label={ __( 'Has background image' ) }
							checked={ !! hasImage }
							onChange={ this.toggleImage }
						/>
					</PanelBody>
					{ hasImage && !! url && (
						<PanelBody title={ __( 'Image Settings' ) }>
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

					{
						! hasImage &&
						<PanelColor
							colorValue={ backgroundColor.value }
							initialOpen={ false }
							title={ __( 'Background Color' ) }
							onChange={ setBackgroundColor }
						/>
					}
				</InspectorControls>
			</Fragment>
		);

		if ( !! hasImage && ! url ) {
			return (
				<div>
					{ controls }
					<MediaPlaceholder
						icon="format-image"
						labels={ {
							title: __( 'Background image' ),
							name: __( 'an image' ),
						} }
						onSelect={ this.onSelectImage }
						accept="image/*"
						type="image"
					/>
				</div>
			);
		}

		return (
			<Fragment>
				{ controls }
				<div
					data-url={ url }
					className={ classes }
					style={ style }
					{ ...data }
				>
					<div className="wp-block-storypage-section-content">
						<InnerBlocks />
					</div>
				</div>
			</Fragment>
		);
	}
}

export default compose(
	withColors( 'backgroundColor' ),
)( SectionBlockEdit );

export function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}

export function backgroundImageStyles( url ) {
	return url ?
		{ backgroundImage: `url(${ url })` } :
		{};
}
