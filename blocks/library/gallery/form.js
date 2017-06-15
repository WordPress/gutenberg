/**
 * External dependencies
 */
import { Fill } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { Toolbar, Placeholder } from 'components';

/**
 * Internal dependencies
 */
import MediaUploadButton from '../../media-upload-button';
import InspectorControls from '../../inspector-controls';
import RangeControl from '../../inspector-controls/range-control';
import GalleryImage from './gallery-image';

const MAX_COLUMNS = 8;

class GalleryBlockForm extends Component {
	constructor() {
		super( ...arguments );
		this.editMediaLibrary = this.editMediaLibrary.bind( this );
		this.setColumnsNumber = this.setColumnsNumber.bind( this );
		this.setMediaUrl = this.setMediaUrl.bind( this );
		this.onCloseMediaModal = this.onCloseMediaModal.bind( this );
		this.bindContainer = this.bindContainer.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	onCloseMediaModal() {
		// Can't find why the setTimeout is needed
		// Probably a focus call conflict
		setTimeout( () => {
			if ( this.container ) {
				this.container.focus();
			}
		} );
	}

	editMediaLibrary() {
		const { attributes, setAttributes } = this.props;
		const frameConfig = {
			frame: 'post',
			title: __( 'Update Gallery media' ),
			button: {
				text: __( 'Select' ),
			},
			multiple: true,
			state: 'gallery-edit',
			selection: new wp.media.model.Selection( attributes.images, { multiple: true } ),
		};

		const editFrame = wp.media( frameConfig );
		function updateFn() {
			setAttributes( {
				images: this.frame.state().attributes.library.models.map( ( a ) => {
					return a.attributes;
				} ),
			} );
		}

		editFrame.on( 'insert', updateFn );
		editFrame.state( 'gallery-edit' ).on( 'update', updateFn );
		editFrame.open( 'gutenberg-gallery' );
	}

	setColumnsNumber( event ) {
		this.props.setAttributes( { columns: event.target.value } );
	}

	setMediaUrl( imgs ) {
		this.props.setAttributes( { images: imgs } );
	}

	render() {
		const { attributes, focus } = this.props;
		const { images = [], align = 'none' } = attributes;
		const { columns = Math.min( 3, images.length ) } = attributes;

		return (
			<div ref={ this.bindContainer } tabIndex="-1">
				{ ! images.length && (
					<Placeholder
						instructions={ __( 'Drag images here or insert from media library' ) }
						icon="format-gallery"
						label={ __( 'Gallery' ) }
						className="blocks-gallery">
						<MediaUploadButton
							onSelect={ this.setMediaUrl }
							type="image"
							autoOpen
							multiple="true"
						>
							{ __( 'Insert from Media Library' ) }
						</MediaUploadButton>
					</Placeholder>
				) }
				{ !! images.length && (
					<div className={ `blocks-gallery align${ align } columns-${ columns }` }>
						<Fill name="Formatting.Toolbar">
							<Toolbar controls={ [ {
								icon: 'edit',
								title: __( 'Edit Gallery' ),
								onClick: this.editMediaLibrary,
							} ] } />
						</Fill>
						{ images.map( ( img ) => (
							<GalleryImage key={ img.url } img={ img } />
						) ) }
						{ focus && images.length > 1 &&
							<InspectorControls>
								<RangeControl
									label={ __( 'Columns' ) }
									value={ columns }
									onChange={ this.setColumnsNumber }
									min="1" max={ Math.min( MAX_COLUMNS, images.length ) }
								/>
							</InspectorControls> }
					</div>
				) }
			</div>
		);
	}
}

export default GalleryBlockForm;
