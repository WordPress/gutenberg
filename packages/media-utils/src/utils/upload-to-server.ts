/**
 * External dependencies
 */
import { createWorkerFactory } from '@shopify/web-worker';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { flattenFormData } from './flatten-form-data';
import { transformAttachment } from './transform-attachment';
import type { CreateRestAttachment, RestAttachment } from './types';

/*
 ! FOR TESTING PURPOSES ONLY !

 __webpack_public_path__ will be something like
 https://example/wp-content/plugins/gutenberg/build/media-utils/../../
 */
const createVipsWorker = createWorkerFactory(
	() => import( /* webpackChunkName: 'vips' */ '@wordpress/vips' )
);
const vipsWorker = createVipsWorker();

void vipsWorker.setLocation( __webpack_public_path__ );

export async function uploadToServer(
	file: File,
	additionalData: CreateRestAttachment = {},
	signal?: AbortSignal
) {
	// FOR TESTING PURPOSES ONLY!
	const outBuffer = await vipsWorker.compressImage(
		'foo',
		await file.arrayBuffer(),
		file.type
	);
	const blob = new Blob( [ outBuffer ], { type: file.type } );
	file = new File( [ blob ], file.name, { type: file.type } );

	// Create upload payload.
	const data = new FormData();
	data.append( 'file', file, file.name || file.type.replace( '/', '.' ) );
	for ( const [ key, value ] of Object.entries( additionalData ) ) {
		flattenFormData(
			data,
			key,
			value as string | Record< string, string > | undefined
		);
	}

	return transformAttachment(
		await apiFetch< RestAttachment >( {
			// This allows the video block to directly get a video's poster image.
			path: '/wp/v2/media?_embed=wp:featuredmedia',
			body: data,
			method: 'POST',
			signal,
		} )
	);
}
