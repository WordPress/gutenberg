/**
 * External dependencies
 */
import { stringify } from 'querystring';
import { uniq, indexOf } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment, RawHTML } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button, IconButton, Placeholder, Spinner, Toolbar } from '@wordpress/components';
import { BlockControls } from '@wordpress/editor';

import './style.scss';
import './editor.scss';

export const name = 'core-embed/link-preview';

const edit = class extends Component {
	constructor() {
		super( ...arguments );
		this.MODES = {
			INPUT_URL: 1,
			FETCH: 2,
			EDITING: 3,
			CANT_FETCH: 4,
		};
		this.state = {
			url: '',
			mode: this.MODES.INPUT_URL,
			images: [],
			selectedImage: undefined,
		};
		this.setupState = this.setupState.bind( this );
		this.setURL = this.setURL.bind( this );
		this.switchBackToURLInput = this.switchBackToURLInput.bind( this );
		this.previousImage = this.previousImage.bind( this );
		this.nextImage = this.nextImage.bind( this );
		this.removeImage = this.removeImage.bind( this );
	}

	componentWillMount() {
		this.setupState( this.props );
	}

	componentWillReceiveProps( newProps ) {
		this.setupState( newProps );
	}

	nextImage() {
		const { images, selectedImage } = this.state;
		const currentIndex = indexOf( images, selectedImage );
		let nextImage;
		if ( images.length === currentIndex + 1 ) {
			nextImage = images[ 0 ];
		} else {
			nextImage = images[ currentIndex + 1 ];
		}
		this.setState( { selectedImage: nextImage } );
		this.props.setAttributes( { images: [ nextImage ] } );
	}

	previousImage() {
		const { images, selectedImage } = this.state;
		const currentIndex = indexOf( images, selectedImage );
		let prevImage;
		if ( 0 === currentIndex ) {
			prevImage = images[ images.length - 1 ];
		} else {
			prevImage = images[ currentIndex - 1 ];
		}
		this.setState( { selectedImage: prevImage } );
		this.props.setAttributes( { images: [ prevImage ] } );
	}

	removeImage() {
		this.setState( { selectedImage: undefined, images: [] } );
		this.props.setAttributes( { images: [] } );
	}

	setupState( newProps ) {
		const { url, images, title, description } = newProps.attributes;
		const hasPreviewData = images.length > 0 || title || description;

		if ( 0 === this.state.images.length && images.length > 0 ) {
			// set up the images with the first image as the selected image
			this.setState( {
				images: uniq( images ),
				selectedImage: images[ 0 ],
			} );
			this.props.setAttributes( { images: [ images[ 0 ] ] } );
		}

		if ( ! url ) {
			this.setState( { mode: this.MODES.INPUT_URL } );
			return;
		}

		this.setState( { url } );

		if ( url && ! hasPreviewData ) {
			// we've only got a url, so fetch the rest from the API
			const apiURL = `/gutenberg/v1/opengraph?${ stringify( { url } ) }`;
			this.setState( { mode: this.MODES.FETCH } );
			apiFetch( { path: apiURL } )
				.then(
					( obj ) => {
						if ( this.unmounting ) {
							return;
						}
						this.props.setAttributes( obj );
						this.setState( { mode: this.MODES.EDITING } );
					},
					() => {
						this.setState( { mode: this.MODES.CANT_FETCH } );
					}
				);
			return;
		}

		this.setState( { mode: this.MODES.EDITING } );
	}

	componentWillUnmount() {
		// can't abort the promise, so let it know we will unmount
		this.unmounting = true;
	}

	setURL( event ) {
		const { url } = this.state;

		if ( url === this.props.attributes.url ) {
			this.setupState( this.props );
			return;
		}

		this.props.setAttributes( { url } );
		if ( event ) {
			event.preventDefault();
		}
	}

	switchBackToURLInput() {
		this.setState( { mode: this.MODES.INPUT_URL } );
	}

	render() {
		const { attributes, isSelected } = this.props;
		const { mode, url, selectedImage, images } = this.state;
		const { FETCH, CANT_FETCH, INPUT_URL } = this.MODES;
		const isEditing = mode === INPUT_URL || mode === CANT_FETCH || mode === FETCH;
		const hasMultipleImages = images.length > 1;
		const label = __( 'Link preview' );
		const controls = (
			<BlockControls>
				<Toolbar>
					{ <IconButton
						className="components-toolbar__control"
						label={ __( 'Edit URL' ) }
						icon="edit"
						onClick={ this.switchBackToURLInput }
					/> }
				</Toolbar>
			</BlockControls>
		);

		if ( isEditing ) {
			return (
				<Fragment>
					{ controls }
					<Placeholder label={ label } className="wp-block-embed">
						<form onSubmit={ this.setURL }>
							{ mode !== FETCH && (
								<Fragment>
									<input
										type="url"
										value={ url || '' }
										className="components-placeholder__input"
										aria-label={ label }
										placeholder={ __( 'Enter URL here…' ) }
										onChange={ ( event ) => this.setState( { url: event.target.value } ) } />
									<Button
										isLarge
										type="submit">
										{ __( 'Preview' ) }
									</Button>
								</Fragment>
							) }
							{ mode === FETCH && (
								<div className="wp-block-embed-link-preview is-loading">
									<Spinner />
									<p>{ __( 'Generating preview…' ) }</p>
								</div>
							) }
							{ mode === CANT_FETCH && <p className="components-placeholder__error">{ __( 'Sorry, we could not generate a preview for that URL.' ) }</p> }
						</form>
					</Placeholder>
				</Fragment>
			);
		}

		return (
			<div className="wp-block-embed-link-preview">
				{ controls }
				<div className="wp-block-embed-link-preview__textinfo">
					<p><a href={ attributes.url }><RawHTML>{ attributes.title }</RawHTML></a></p>
					<p className="wp-block-embed-link-preview__description"><RawHTML>{ attributes.description }</RawHTML></p>
				</div>
				{ selectedImage && (
					<div className="wp-block-embed-link-preview__image">
						<div className="wp-block-embed-link-preview__image__selected">
							<img src={ selectedImage.src } alt="" />
						</div>
						{ isSelected &&
						<div className="wp-block-embed-link-preview__image__tools">
							{ hasMultipleImages &&
								<IconButton
									aria-label={ __( 'Previous image' ) }
									icon="arrow-left-alt2"
									onClick={ this.previousImage } />
							}
							<IconButton
								icon="no"
								aria-label={ __( 'Remove image' ) }
								onClick={ this.removeImage } />
							{ hasMultipleImages &&
								<IconButton
									aria-label={ __( 'Next image' ) }
									icon="arrow-right-alt2"
									onClick={ this.nextImage } />
							}
						</div>
						}
					</div>
				) }
			</div>
		);
	}
};

const save = function( { attributes } ) {
	return (
		<div className="wp-block-embed-link-preview">
			<div className="wp-block-embed-link-preview__textinfo">
				<p><a href={ attributes.url }><RawHTML>{ attributes.title }</RawHTML></a></p>
				<p className="wp-block-embed-link-preview__description"><RawHTML>{ attributes.description }</RawHTML></p>
			</div>
			{ attributes.images.length > 0 && (
				<div className="wp-block-embed-link-preview__image">
					{ attributes.images.map(
						( image ) => <img src={ image.src } alt="" key={ image.src } />
					) }
				</div>
			) }
		</div>
	);
};

export const settings = {
	title: __( 'Link preview' ),
	description: __( 'Add a preview for a link.' ),
	category: 'embed',
	icon: 'admin-links',
	attributes: {
		images: {
			source: 'query',
			selector: 'img',
			query: {
				src: { source: 'attribute', attribute: 'src' },
			},
			default: [],
		},
		url: {
			source: 'attribute',
			selector: 'a',
			attribute: 'href',
		},
		title: {
			source: 'text',
			selector: 'a',
		},
		description: {
			source: 'text',
			selector: 'p.wp-block-embed-link-preview__description',
		},
	},
	edit,
	save,
};
