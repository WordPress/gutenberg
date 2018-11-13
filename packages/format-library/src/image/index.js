/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { insertObject } from '@wordpress/rich-text';
import { MediaUpload, RichTextInserterItem, MediaUploadCheck } from '@wordpress/editor';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

const name = 'core/image';

export const image = {
	name,
	title: __( 'Image' ),
	keywords: [ __( 'photo' ), __( 'media' ) ],
	object: true,
	tagName: 'img',
	className: null,
	attributes: {
		className: 'class',
		style: 'style',
		url: 'src',
		alt: 'alt',
	},
	edit: class ImageEdit extends Component {
		constructor() {
			super( ...arguments );
			this.openModal = this.openModal.bind( this );
			this.closeModal = this.closeModal.bind( this );
			this.state = {
				modal: false,
			};
		}

		openModal() {
			this.setState( { modal: true } );
		}

		closeModal() {
			this.setState( { modal: false } );
		}

		render() {
			const { value, onChange } = this.props;

			return (
				<MediaUploadCheck>
					<RichTextInserterItem
						name={ name }
						icon={ <SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><Path d="M4 16h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2zM4 5h10v9H4V5zm14 9v2h4v-2h-4zM2 20h20v-2H2v2zm6.4-8.8L7 9.4 5 12h8l-2.6-3.4-2 2.6z" /></SVG> }
						title={ __( 'Inline Image' ) }
						onClick={ this.openModal }
					/>
					{ this.state.modal && <MediaUpload
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						onSelect={ ( { id, url, alt, width } ) => {
							this.closeModal();
							onChange( insertObject( value, {
								type: name,
								attributes: {
									className: `wp-image-${ id }`,
									style: `width: ${ Math.min( width, 150 ) }px;`,
									url,
									alt,
								},
							} ) );
						} }
						onClose={ this.closeModal }
						render={ ( { open } ) => {
							open();
							return null;
						} }
					/> }
				</MediaUploadCheck>
			);
		}
	},
};
