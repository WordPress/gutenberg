/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlobURL } from '@wordpress/utils';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import edit from './edit';

export const name = 'core/file';

export const settings = {
	title: __( 'File' ),

	description: __( 'Link to a file.' ),

	icon: 'media-default',

	category: 'common',

	keywords: [ __( 'document' ), __( 'pdf' ) ],

	attributes: {
		href: {
			type: 'string',
		},
		fileName: {
			type: 'string',
			source: 'text',
			selector: 'a:not([download])',
		},
		textLinkHref: {
			type: 'string',
			source: 'attribute',
			selector: 'a:not([download])',
			attribute: 'href',
		},
		openInNewWindow: {
			type: 'string',
			source: 'attribute',
			selector: 'a:not([download])',
			attribute: 'target',
		},
		showDownloadButton: {
			type: 'boolean',
			default: true,
		},
		buttonText: {
			type: 'string',
			source: 'text',
			selector: 'a[download]',
			default: __( 'Download' ),
		},
		id: {
			type: 'number',
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
						fileName: attributes.caption && attributes.caption.join(),
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
						fileName: attributes.caption && attributes.caption.join(),
						textLinkHref: attributes.src,
						id: attributes.id,
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/audio' ],
				transform: ( attributes ) => {
					return createBlock( 'core/audio', {
						src: attributes.href,
						caption: [ attributes.fileName ],
						id: attributes.id,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/video' ],
				transform: ( attributes ) => {
					return createBlock( 'core/video', {
						src: attributes.href,
						caption: [ attributes.fileName ],
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
			openInNewWindow,
			showDownloadButton,
			buttonText,
		} = attributes;

		return ( href &&
			<div>
				{ fileName &&
					<a
						href={ textLinkHref }
						target={ openInNewWindow }
						rel={ openInNewWindow ? 'noreferrer noopener' : false }
					>
						{ fileName }
					</a>
				}
				{ showDownloadButton &&
					<a
						href={ href }
						className="wp-block-file__button"
						download={ fileName }>
						{ buttonText }
					</a>
				}
			</div>
		);
	},

};
