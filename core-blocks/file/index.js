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
			source: 'attribute',
			selector: 'a[download]',
			attribute: 'href',
		},
		fileName: {
			source: 'text',
			selector: 'a:not([download])',
		},
		textLinkHref: {
			source: 'attribute',
			selector: 'a:not([download])',
			attribute: 'href',
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
		],
	},

	edit,

	save( { attributes } ) {
		const { href, fileName, textLinkHref } = attributes;
		return (
			<div>
				<a href={ textLinkHref }>
					{ fileName }
				</a>
				<a
					href={ href }
					className="wp-block-file__button"
					download="download">
					{ __( 'Download' ) }
				</a>
			</div>
		);
	},

};
