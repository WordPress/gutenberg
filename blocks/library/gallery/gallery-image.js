/**
 * External Depenedencies
 */
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';
import { IconButton, withAPIData, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RichText from '../../rich-text';

class GalleryImage extends Component {
	constructor() {
		super( ...arguments );

		this.onImageClick = this.onImageClick.bind( this );
		this.onSelectCaption = this.onSelectCaption.bind( this );

		this.state = {
			captionSelected: false,
		};
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

	onImageClick() {
		if ( ! this.props.isSelected ) {
			this.props.onSelect();
		}

		if ( this.state.captionSelected ) {
			this.setState( {
				captionSelected: false,
			} );
		}
	}

	componentWillReceiveProps( { isSelected, image } ) {
		if ( image && image.data && ! this.props.url ) {
			this.props.setAttributes( {
				url: image.data.source_url,
				alt: image.data.alt_text,
			} );
		}

		// unselect the caption so when the user selects other image and comeback
		// the caption is not immediately selected
		if ( this.state.captionSelected && ! isSelected && this.props.isSelected ) {
			this.setState( {
				captionSelected: false,
			} );
		}
	}

	render() {
		const { url, alt, id, linkTo, link, isSelected, caption, onRemove, setAttributes } = this.props;

		let href;

		switch ( linkTo ) {
			case 'media':
				href = url;
				break;
			case 'attachment':
				href = link;
				break;
		}

		// Disable reason: Image itself is not meant to be
		// interactive, but should direct image selection and unfocus caption fields
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
		const img = url ? <img src={ url } alt={ alt } data-id={ id } onClick={ this.onImageClick } /> : <Spinner />;

		const className = classnames( {
			'is-selected': isSelected,
			'is-transient': url && 0 === url.indexOf( 'blob:' ),
		} );

		// Disable reason: Each block can be selected by clicking on it and we should keep the same saved markup
		/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<figure className={ className }>
				{ isSelected &&
					<div className="blocks-gallery-item__inline-menu">
						<IconButton
							icon="no-alt"
							onClick={ onRemove }
							className="blocks-gallery-item__remove"
							label={ __( 'Remove Image' ) }
						/>
					</div>
				}
				{ href ? <a href={ href }>{ img }</a> : img }
				{ ( caption && caption.length > 0 ) || isSelected ? (
					<RichText
						tagName="figcaption"
						placeholder={ __( 'Write caption…' ) }
						value={ caption }
						isSelected={ this.state.captionSelected }
						onChange={ newCaption => setAttributes( { caption: newCaption } ) }
						onFocus={ this.onSelectCaption }
						inlineToolbar
					/>
				) : null }
			</figure>
		);
		/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default withAPIData( ( { id } ) => ( {
	image: id ? `/wp/v2/media/${ id }` : {},
} ) )( GalleryImage );
