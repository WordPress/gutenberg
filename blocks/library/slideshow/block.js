/**
 * External Dependencies
 */
import classnames from 'classnames';
import { throttle, pick, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import {
	Toolbar,
	IconButton,
	RangeControl,
	SelectControl,
	ToggleControl,
	DropZone,
	Dashicon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { mediaUpload } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import BlockControls from '../../block-controls';
import ImagePlaceholder from '../../image-placeholder';
import InspectorControls from '../../inspector-controls';
import MediaUpload from '../../media-upload';

/**
 * TODO:
 * - Implement titles and captions
 * - Implement 'photo' pagination style
 * - Make slideshows work on the frontend
 * - Implement 'slideshow duration'
 * - Implement 'Link to' functionality
 */

class SlideshowBlock extends Component {
	constructor() {
		super( ...arguments );

		this.bindViewportRef = this.bindViewportRef.bind( this );
		this.handleWindowResize = throttle( this.handleWindowResize.bind( this ), 100 );
		this.handleSelectImages = this.handleSelectImages.bind( this );
		this.handleFilesDrop = this.handleFilesDrop.bind( this );
		this.handlePreviousClick = this.handlePreviousClick.bind( this );
		this.handleNextClick = this.handleNextClick.bind( this );

		this.state = {
			currentIndex: 0,
			viewportWidth: 0,
		};
	}

	componentDidMount() {
		window.addEventListener( 'resize', this.handleWindowResize );
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.handleWindowResize );
	}

	bindViewportRef( ref ) {
		this.viewport = ref;
		this.updateViewportWidth();
	}

	handleWindowResize() {
		this.updateViewportWidth();
	}

	updateViewportWidth() {
		this.setState( { viewportWidth: this.viewport.offsetWidth } );
	}

	handleSelectImages( images ) {
		this.props.setAttributes( {
			images: images.map( ( image ) => pick( image, [ 'url', 'id', 'alt', 'caption', 'link' ] ) ),
		} );
	}

	handleFilesDrop( files ) {
		const { attributes, setAttributes } = this.props;
		const currentImages = attributes.images || [];

		mediaUpload(
			files,
			( images ) => {
				setAttributes( {
					images: currentImages.concat( images ),
				} );
			},
			'image'
		);
	}

	handlePreviousClick() {
		this.setState( ( { currentIndex } ) => ( {
			currentIndex: currentIndex > 0 ? currentIndex - 1 : 0,
		} ) );
	}

	handleNextClick() {
		const maxIndex = this.props.attributes.images.length - 1;
		this.setState( ( { currentIndex } ) => ( {
			currentIndex: currentIndex < maxIndex ? currentIndex + 1 : maxIndex,
		} ) );
	}

	render() {
		const { currentIndex, viewportWidth } = this.state;
		const { attributes, isSelected, setAttributes, className } = this.props;
		const { images, align, duration, pagination, showArrows, showTitles, showCaptions, linkTo } = attributes;

		const controls = isSelected && (
			<BlockControls>
				<BlockAlignmentToolbar value={ align } onChange={ ( value ) => setAttributes( { align: value } ) } />

				{ ! isEmpty( images ) && (
					<Toolbar>
						<MediaUpload
							type="image"
							multiple
							// TODO: We maybe shouldn't need to 'create a gallery' (as per Zeplin mockup)
							gallery
							value={ images.map( ( img ) => img.id ) }
							onSelect={ this.handleSelectImages }
							render={ ( { open } ) => (
								<IconButton
									className="components-toolbar__control"
									icon="edit"
									label={ __( 'Select Images' ) }
									onClick={ open }
								/>
							) }
						/>
					</Toolbar>
				) }
			</BlockControls>
		);

		if ( images.length === 0 ) {
			return (
				<Fragment>
					{ controls }
					<ImagePlaceholder
						className={ className }
						icon="slideshow"
						label={ __( 'Slideshow' ) }
						multiple
						onSelectImage={ this.handleSelectImages }
					/>
				</Fragment>
			);
		}

		return (
			<Fragment>
				{ controls }

				{ isSelected && (
					<InspectorControls>
						<h2>{ __( 'Slideshow Settings' ) }</h2>
						<RangeControl
							label={ __( 'Slide Duration (in Seconds)' ) }
							value={ duration }
							onChange={ ( value ) => setAttributes( { duration: value } ) }
							min={ 0 }
							max={ 10 }
						/>
						<SelectControl
							label={ __( 'Pagination Style' ) }
							value={ pagination }
							options={ [
								{ value: 'dot', label: __( 'Dot' ) },
								{ value: 'photo', label: __( 'Photo' ) },
								{ value: 'none', label: __( 'None' ) },
							] }
							onChange={ ( value ) => setAttributes( { pagination: value } ) }
						/>
						<ToggleControl
							label={ __( 'Show Arrows' ) }
							checked={ !! showArrows }
							onChange={ ( value ) => setAttributes( { showArrows: value } ) }
						/>
						<ToggleControl
							label={ __( 'Show Titles' ) }
							checked={ !! showTitles }
							onChange={ ( value ) => setAttributes( { showTitles: value } ) }
						/>
						<ToggleControl
							label={ __( 'Show Captions' ) }
							checked={ !! showCaptions }
							onChange={ ( value ) => setAttributes( { showCaptions: value } ) }
						/>
						<SelectControl
							label={ __( 'Link to' ) }
							value={ linkTo }
							options={ [
								{ value: 'attachment', label: __( 'Attachment Page' ) },
								{ value: 'media', label: __( 'Media File' ) },
								{ value: 'none', label: __( 'None' ) },
							] }
							onChange={ ( value ) => setAttributes( { linkTo: value } ) }
						/>
					</InspectorControls>
				) }

				<div ref={ this.bindViewportRef } className="blocks-slideshow__viewport">
					<ul
						className="blocks-slideshow__items"
						style={ {
							width: `${ images.length * 100 }%`,
							transform: `translate3d(-${ currentIndex * viewportWidth }px, 0, 0)`,
						} }
					>
						<DropZone onFilesDrop={ this.handleFilesDrop } />
						{ images.map( ( image ) => (
							<li className="blocks-slideshow__item" key={ image.id || image.url }>
								<img
									className="blocks-slideshow__image"
									src={ image.url }
									alt={ image.alt }
									data-id={ image.id }
									data-link={ image.link }
								/>
							</li>
						) ) }
					</ul>

					{ showArrows && (
						<Fragment>
							<button
								className="blocks-slideshow__previous"
								aria-label={ __( 'Previous image ' ) }
								onClick={ this.handlePreviousClick }
							>
								<Dashicon icon="arrow-left-alt2" />
							</button>
							<button
								className="blocks-slideshow__next"
								aria-label={ __( 'Next image' ) }
								onClick={ this.handleNextClick }
							>
								<Dashicon icon="arrow-right-alt2" />
							</button>
						</Fragment>
					) }
				</div>

				{ pagination !== 'none' && (
					<ul className="blocks-slideshow__pagination">
						{ images.map( ( image, index ) => (
							<li key={ index }>
								<button
									className={ classnames( {
										'is-selected': currentIndex === index,
									} ) }
									aria-pressed={ currentIndex === index }
									onClick={ () => this.setState( { currentIndex: index } ) }
								>
									{ __( `Image ${ index + 1 }` ) }
								</button>
							</li>
						) ) }
					</ul>
				) }
			</Fragment>
		);
	}
}

export default SlideshowBlock;
