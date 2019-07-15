/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { IconButton, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { withSelect } from '@wordpress/data';
import { RichText } from '@wordpress/block-editor';
import { isBlobURL } from '@wordpress/blob';

class GalleryImage extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectCaption = this.onSelectCaption.bind( this );
		this.onRemoveImage = this.onRemoveImage.bind( this );
		this.bindContainer = this.bindContainer.bind( this );

		this.state = {
			captionSelected: false,
		};
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	onSelectCaption() {
		if ( ! this.state.captionSelected ) {
			this.setState( {
				captionSelected: true,
			} );
		}

		if ( ! this.props.isSelected ) {
			this.props.onSelect();
		}
	}

	onSelectImage() {
		if ( ! this.props.isSelected ) {
			this.props.onSelect();
		}

		if ( this.state.captionSelected ) {
			this.setState( {
				captionSelected: false,
			} );
		}
	}

	onRemoveImage( event ) {
		if (
			this.container === document.activeElement &&
			this.props.isSelected && [ BACKSPACE, DELETE ].indexOf( event.keyCode ) !== -1
		) {
			event.stopPropagation();
			event.preventDefault();
			this.props.onRemove();
		}
	}

	componentDidUpdate( prevProps ) {
		const { isSelected, image, url } = this.props;
		if ( image && ! url ) {
			this.props.setAttributes( {
				url: image.source_url,
				alt: image.alt_text,
			} );
		}

		// unselect the caption so when the user selects other image and comeback
		// the caption is not immediately selected
		if ( this.state.captionSelected && ! isSelected && prevProps.isSelected ) {
			this.setState( {
				captionSelected: false,
			} );
		}
	}

	render() {
		const { url, alt, id, linkTo, link, isFirstItem, isLastItem, isSelected, caption, onRemove, onMoveForward, onMoveBackward, setAttributes, 'aria-label': ariaLabel } = this.props;

		let href;

		switch ( linkTo ) {
			case 'media':
				href = url;
				break;
			case 'attachment':
				href = link;
				break;
		}

		const img = (
			// Disable reason: Image itself is not meant to be interactive, but should
			// direct image selection and unfocus caption fields.
			/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
			<>
				<img
					src={ url }
					alt={ alt }
					data-id={ id }
					onClick={ this.onSelectImage }
					onFocus={ this.onSelectImage }
					onKeyDown={ this.onRemoveImage }
					tabIndex="0"
					aria-label={ ariaLabel }
					ref={ this.bindContainer }
				/>
				{ isBlobURL( url ) && <Spinner /> }
			</>
			/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
		);

		const className = classnames( {
			'is-selected': isSelected,
			'is-transient': isBlobURL( url ),
		} );

		return (
			<figure className={ className }>
				{ href ? <a href={ href }>{ img }</a> : img }
				<div className="block-library-gallery-item__move-menu">
					<IconButton
						icon="arrow-left"
						onClick={ isFirstItem ? undefined : onMoveBackward }
						className="blocks-gallery-item__move-backward"
						label={ __( 'Move Image Backward' ) }
						aria-disabled={ isFirstItem }
						disabled={ ! isSelected }
					/>
					<IconButton
						icon="arrow-right"
						onClick={ isLastItem ? undefined : onMoveForward }
						className="blocks-gallery-item__move-forward"
						label={ __( 'Move Image Forward' ) }
						aria-disabled={ isLastItem }
						disabled={ ! isSelected }
					/>
				</div>
				<div className="block-library-gallery-item__inline-menu">
					<IconButton
						icon="no-alt"
						onClick={ onRemove }
						className="blocks-gallery-item__remove"
						label={ __( 'Remove Image' ) }
						disabled={ ! isSelected }
					/>
				</div>
				<RichText
					tagName="figcaption"
					placeholder={ isSelected ? __( 'Write caption…' ) : null }
					value={ caption }
					isSelected={ this.state.captionSelected }
					onChange={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
					unstableOnFocus={ this.onSelectCaption }
					inlineToolbar
				/>
			</figure>
		);
	}
}

export default withSelect( ( select, ownProps ) => {
	const { getMedia } = select( 'core' );
	const { id } = ownProps;

	return {
		image: id ? getMedia( id ) : null,
	};
} )( GalleryImage );
