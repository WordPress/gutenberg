/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { RichText } from '@wordpress/editor';
import { getTextContent, isEmpty } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/file';

export const settings = {
	title: __( 'File' ),

	description: __( 'Add a link to a file that visitors can download.' ),

	icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><path d="M9 6l2 2h9v10H4V6h5m1-2H4L2 6v12l2 2h16l2-2V8l-2-2h-8l-2-2z" /></svg>,

	category: 'common',

	keywords: [ __( 'document' ), __( 'pdf' ) ],

	attributes: {
		id: {
			type: 'number',
		},
		href: {
			type: 'string',
		},
		fileName: {
			source: 'rich-text',
			selector: 'a:not([download])',
		},
		// Differs to the href when the block is configured to link to the attachment page
		textLinkHref: {
			type: 'string',
			source: 'attribute',
			selector: 'a:not([download])',
			attribute: 'href',
		},
		// e.g. `_blank` when the block is configured to open in a new window
		textLinkTarget: {
			type: 'string',
			source: 'attribute',
			selector: 'a:not([download])',
			attribute: 'target',
		},
		showDownloadButton: {
			type: 'boolean',
			default: true,
		},
		downloadButtonText: {
			source: 'rich-text',
			selector: 'a[download]',
			default: __( 'Download' ),
		},
	},

	supports: {
		align: true,
	},

	transforms: {
		from: [
			{
				type: 'files',
				isMatch: ( files ) => files.length === 1,
				// We define a lower priorty (higher number) than the default of 10. This
				// ensures that the File block is only created as a fallback.
				priority: 15,
				transform: ( files ) => {
					const file = files[ 0 ];
					const blobURL = createBlobURL( file );

					// File will be uploaded in componentDidMount()
					return createBlock( 'core/file', {
						href: blobURL,
						fileName: file.name,
						textLinkHref: blobURL,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/audio' ],
				transform: ( attributes ) => {
					return createBlock( 'core/file', {
						href: attributes.src,
						fileName: attributes.caption,
						textLinkHref: attributes.src,
						id: attributes.id,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/video' ],
				transform: ( attributes ) => {
					return createBlock( 'core/file', {
						href: attributes.src,
						fileName: attributes.caption,
						textLinkHref: attributes.src,
						id: attributes.id,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( attributes ) => {
					return createBlock( 'core/file', {
						href: attributes.url,
						fileName: attributes.caption,
						textLinkHref: attributes.url,
						id: attributes.id,
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
				transform: ( attributes ) => {
					return createBlock( 'core/audio', {
						src: attributes.href,
						caption: attributes.fileName,
						id: attributes.id,
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
				transform: ( attributes ) => {
					return createBlock( 'core/video', {
						src: attributes.href,
						caption: attributes.fileName,
						id: attributes.id,
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
				transform: ( attributes ) => {
					return createBlock( 'core/image', {
						url: attributes.href,
						caption: attributes.fileName,
						id: attributes.id,
					} );
				},
			},
		],
	},

	edit,

	save( { attributes } ) {
		const {
			href,
			fileName,
			textLinkHref,
			textLinkTarget,
			showDownloadButton,
			downloadButtonText,
		} = attributes;

		return ( href &&
			<div>
				{ ! isEmpty( fileName ) &&
					<a
						href={ textLinkHref }
						target={ textLinkTarget }
						rel={ textLinkTarget ? 'noreferrer noopener' : false }
					>
						<RichText.Content
							value={ fileName }
						/>
					</a>
				}
				{ showDownloadButton &&
					<a
						href={ href }
						className="wp-block-file__button"
						// ensure download attribute is still set when fileName
						// is undefined. Using '' here as `true` still leaves
						// the attribute unset.
						download={ getTextContent( fileName ) }
					>
						<RichText.Content
							value={ downloadButtonText }
						/>
					</a>
				}
			</div>
		);
	},

};
