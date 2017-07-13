/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { DropZone } from 'components';
import { createBlock } from 'blocks';

/**
 * Internal dependencies
 */
import {
	insertBlock,
	updateBlockAttributes,
	removeBlock,
	createWarningNotice,
	createErrorNotice,
} from '../actions';

/**
 * Array of handlers describing behavior to be invoked when media is dropped
 * within the editor. Each handler describes the types of media it can handle,
 * the initial block to be created, and upload behavior.
 *
 * @type {Array}
 */
const MEDIA_HANDLERS = [
	{
		isHandled: ( type ) => /^image\//.test( type ),
		getInitialBlock( media ) {
			return createBlock( 'core/image', {
				url: window.URL.createObjectURL( media ),
			} );
		},
		upload( media ) {
			const data = new window.FormData();
			data.append( 'file', media );

			return new Promise( ( resolve, reject ) => {
				new wp.api.models.Media().save( null, {
					data: data,
					contentType: false,
				} ).done( ( savedMedia ) => {
					const { id, source_url: url } = savedMedia;
					resolve( { id, url } );
				} ).fail( reject );
			} );
		},
	},
];

class MediaDropZone extends Component {
	constructor() {
		super( ...arguments );

		this.uploadFiles = this.uploadFiles.bind( this );
	}

	uploadFiles( files ) {
		const media = files[ 0 ];
		const handler = find(
			MEDIA_HANDLERS,
			( { isHandled } ) => isHandled( media.type )
		);

		if ( ! handler ) {
			this.props.onUnhandledType( __( 'This file type is not supported' ) );
			return;
		}

		const block = handler.getInitialBlock( media );
		this.props.insertBlock( block );

		handler.upload( media ).then(
			( attributes ) => {
				this.props.updateBlockAttributes( block.uid, attributes );
			},
			() => {
				this.props.onUploadError( __( 'An error occurred while uploading media' ) );
				this.props.removeBlock( block.uid );
			}
		);
	}

	render() {
		return <DropZone onFilesDrop={ this.uploadFiles } />;
	}
}

export default connect( null, {
	insertBlock,
	updateBlockAttributes,
	removeBlock,
	onUnhandledType: createWarningNotice,
	onUploadError: createErrorNotice,
} )( MediaDropZone );
