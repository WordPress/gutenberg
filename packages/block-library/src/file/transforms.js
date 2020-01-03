/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { select } from '@wordpress/data';

const transforms = {
	from: [
		{
			type: 'files',
			isMatch( files ) {
				return files.length > 0;
			},
			// We define a lower priorty (higher number) than the default of 10. This
			// ensures that the File block is only created as a fallback.
			priority: 15,
			convert: ( files ) => {
				const blocks = [];

				files.forEach( ( file ) => {
					const blobURL = createBlobURL( file );

					// File will be uploaded in componentDidMount()
					blocks.push( createBlock( 'core/file', {
						href: blobURL,
						fileName: file.name,
						textLinkHref: blobURL,
					} ) );
				} );

				return blocks;
			},
		},
		{
			type: 'block',
			blocks: [ 'core/audio' ],
			convert: ( block ) => {
				return createBlock( 'core/file', {
					href: block.attributes.src,
					fileName: block.attributes.caption,
					textLinkHref: block.attributes.src,
					id: block.attributes.id,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			convert: ( block ) => {
				return createBlock( 'core/file', {
					href: block.attributes.src,
					fileName: block.attributes.caption,
					textLinkHref: block.attributes.src,
					id: block.attributes.id,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/image' ],
			convert: ( block ) => {
				return createBlock( 'core/file', {
					href: block.attributes.url,
					fileName: block.attributes.caption,
					textLinkHref: block.attributes.url,
					id: block.attributes.id,
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/audio' ],
			isMatch: ( { id } ) => {
				if ( ! id ) {
					return false;
				}
				const { getMedia } = select( 'core' );
				const media = getMedia( id );
				return !! media && includes( media.mime_type, 'audio' );
			},
			convert: ( block ) => {
				return createBlock( 'core/audio', {
					src: block.attributes.href,
					caption: block.attributes.fileName,
					id: block.attributes.id,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/video' ],
			isMatch: ( { id } ) => {
				if ( ! id ) {
					return false;
				}
				const { getMedia } = select( 'core' );
				const media = getMedia( id );
				return !! media && includes( media.mime_type, 'video' );
			},
			convert: ( block ) => {
				return createBlock( 'core/video', {
					src: block.attributes.href,
					caption: block.attributes.fileName,
					id: block.attributes.id,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/image' ],
			isMatch: ( { id } ) => {
				if ( ! id ) {
					return false;
				}
				const { getMedia } = select( 'core' );
				const media = getMedia( id );
				return !! media && includes( media.mime_type, 'image' );
			},
			convert: ( block ) => {
				return createBlock( 'core/image', {
					url: block.attributes.href,
					caption: block.attributes.fileName,
					id: block.attributes.id,
				} );
			},
		},
	],
};

export default transforms;
