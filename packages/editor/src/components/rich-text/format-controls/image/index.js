/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, Component } from '@wordpress/element';
import { Fill } from '@wordpress/components';
import { insertObject } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import InserterListItem from '../../../inserter-list-item';
import MediaUpload from '../../../media-upload';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

export const image = {
	format: 'image',
	selector: 'img',
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
				<Fragment>
					<Fill name="Inserter.InlineElements">
						<InserterListItem
							icon={ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 16h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2zM4 5h10v9H4V5zm14 9v2h4v-2h-4zM2 20h20v-2H2v2zm6.4-8.8L7 9.4 5 12h8l-2.6-3.4-2 2.6z" /></svg> }
							title={ __( 'Inline Image' ) }
							onClick={ this.openModal }
						/>
					</Fill>
					{ this.state.modal && <MediaUpload
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						onSelect={ ( { id, url, alt, width } ) => {
							this.closeModal();
							onChange( insertObject( value, {
								type: 'img',
								attributes: {
									class: `wp-image-${ id }`,
									style: `width: ${ Math.min( width, 150 ) }px;`,
									src: url,
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
				</Fragment>
			);
		}
	},
};
