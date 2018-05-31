/**
 * External Dependencies
 */
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';
import { IconButton, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { keycodes } from '@wordpress/utils';
import { withSelect } from '@wordpress/data';
import { RichText } from '@wordpress/editor';

/**
 * Module constants
 */
const { BACKSPACE, DELETE } = keycodes;

class GalleryImage extends Component {
	constructor() {
		super( ...arguments );

		this.onKeyDown = this.onKeyDown.bind( this );
		this.bindContainer = this.bindContainer.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	onKeyDown( event ) {
		if (
			this.container === document.activeElement &&
			this.props.isSelected && [ BACKSPACE, DELETE ].indexOf( event.keyCode ) !== -1
		) {
			event.stopPropagation();
			event.preventDefault();
			this.props.onRemove();
		}
	}

	componentWillReceiveProps( { image, url } ) {
		if ( image && ! url ) {
			this.props.setAttributes( {
				url: image.source_url,
				alt: image.alt_text,
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
		const img = url ? <img src={ url } alt={ alt } data-id={ id } /> : <Spinner />;

		const className = classnames( {
			'is-selected': isSelected,
			'is-transient': url && 0 === url.indexOf( 'blob:' ),
		} );

		// Disable reason: Each block can be selected by clicking on it and we should keep the same saved markup
		/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<figure
				className={ className }
				tabIndex="-1"
				onFocus={ this.props.onSelect }
				onKeyDown={ this.onKeyDown }
				ref={ this.bindContainer }
			>
				{ isSelected &&
					<div className="core-blocks-gallery-item__inline-menu">
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
						onChange={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
						inlineToolbar
					/>
				) : null }
			</figure>
		);
		/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default withSelect( ( select, ownProps ) => {
	const { getMedia } = select( 'core' );
	const { id } = ownProps;

	return {
		image: id ? getMedia( id ) : null,
	};
} )( GalleryImage );
