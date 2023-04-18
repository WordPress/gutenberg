/**
 * External dependencies
 */
import * as fs from 'fs';

/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface Media {
	id: number;
	title: {
		raw: string;
		rendered: string;
	};
	source_url: string;
	slug: string;
	alt_text: string;
	caption: { rendered: string };
	link: string;
}

/**
 * List all media files.
 *
 * @see https://developer.wordpress.org/rest-api/reference/media/#list-media
 * @param this
 */
async function listMedia( this: RequestUtils ) {
	const response = await this.rest< Media[] >( {
		method: 'GET',
		path: '/wp/v2/media',
		params: {
			per_page: 100,
		},
	} );

	return response;
}

/**
 * Upload a media file.
 *
 * @see https://developer.wordpress.org/rest-api/reference/media/#create-a-media-item
 * @param this
 * @param filePathOrData The path or data of the file being uploaded.
 */
async function uploadMedia(
	this: RequestUtils,
	filePathOrData: string | fs.ReadStream
) {
	const file =
		typeof filePathOrData === 'string'
			? fs.createReadStream( filePathOrData )
			: filePathOrData;

	const response = await this.rest< Media >( {
		method: 'POST',
		path: '/wp/v2/media',
		multipart: {
			file,
		},
	} );

	return response;
}

/**
 * delete a media file.
 *
 * @see https://developer.wordpress.org/rest-api/reference/media/#delete-a-media-item
 * @param this
 * @param mediaId The ID of the media file.
 */
async function deleteMedia( this: RequestUtils, mediaId: number ) {
	const response = await this.rest( {
		method: 'DELETE',
		path: `/wp/v2/media/${ mediaId }`,
		params: { force: true },
	} );

	return response;
}

/**
 * delete all media files.
 *
 * @param this
 */
async function deleteAllMedia( this: RequestUtils ) {
	const files = await this.listMedia();

	// The media endpoint doesn't support batch request yet.
	const responses = await Promise.all(
		files.map( ( media ) => this.deleteMedia( media.id ) )
	);

	return responses;
}

export { listMedia, uploadMedia, deleteMedia, deleteAllMedia };
