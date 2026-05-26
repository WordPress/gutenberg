/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	OnErrorHandler,
	CreateSideloadFile,
	RestAttachment,
	SubSizeData,
} from './types';
import { sideloadToServer } from './sideload-to-server';
import { UploadError } from './upload-error';

const noop = () => {};

type OnSubSizeHandler = ( subSize: SubSizeData ) => void;

interface SideloadMediaArgs {
	// Additional data to include in the request.
	additionalData?: CreateSideloadFile;
	// File to sideload.
	file: File;
	// Attachment ID.
	attachmentId: RestAttachment[ 'id' ];
	// Function called when an error happens.
	onError?: OnErrorHandler;
	// Function called when the sideload completes with sub-size data.
	onSuccess?: OnSubSizeHandler;
	// Abort signal.
	signal?: AbortSignal;
}

/**
 * Uploads a file to the server without creating an attachment.
 *
 * Returns sub-size data instead of a full attachment. The client
 * accumulates this data and sends it to the finalize endpoint.
 *
 * @param $0                Parameters object passed to the function.
 * @param $0.file           Media File to Save.
 * @param $0.attachmentId   Parent attachment ID.
 * @param $0.additionalData Additional data to include in the request.
 * @param $0.signal         Abort signal.
 * @param $0.onSuccess      Function called when the sideload completes with sub-size data.
 * @param $0.onError        Function called when an error happens.
 */
export async function sideloadMedia( {
	file,
	attachmentId,
	additionalData = {},
	signal,
	onSuccess,
	onError = noop,
}: SideloadMediaArgs ) {
	try {
		const subSizeData = await sideloadToServer(
			file,
			attachmentId,
			additionalData,
			signal
		);
		onSuccess?.( subSizeData );
	} catch ( error ) {
		let message;
		if ( error instanceof Error ) {
			message = error.message;
		} else {
			message = sprintf(
				// translators: %s: file name
				__( 'Error while sideloading file %s to the server.' ),
				file.name
			);
		}
		onError(
			new UploadError( {
				code: 'GENERAL',
				message,
				file,
				cause: error instanceof Error ? error : undefined,
			} )
		);
	}
}
