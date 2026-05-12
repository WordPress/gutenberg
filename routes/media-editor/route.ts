/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';

declare global {
	interface Window {
		__experimentalMediaEditor?: boolean;
	}
}

function getAttachmentId( id: string ) {
	const attachmentId = parseInt( id, 10 );
	if ( Number.isNaN( attachmentId ) || attachmentId <= 0 ) {
		throw notFound();
	}
	return attachmentId;
}

function getAttachmentTitle( attachment: {
	title?: string | { rendered?: string; raw?: string };
} ) {
	const title =
		typeof attachment.title === 'string'
			? attachment.title
			: attachment.title?.rendered || attachment.title?.raw;

	return title ? decodeEntities( title ) : __( 'Edit media' );
}

/**
 * Route configuration for the dedicated media editor screen.
 */
export const route = {
	beforeLoad: async ( { params }: { params: { id: string } } ) => {
		if ( ! window?.__experimentalMediaEditor ) {
			throw notFound();
		}

		const attachmentId = getAttachmentId( params.id );

		try {
			const attachment = await resolveSelect( coreStore ).getEntityRecord(
				'postType',
				'attachment',
				attachmentId
			);

			if ( ! attachment ) {
				throw notFound();
			}
		} catch {
			throw notFound();
		}
	},
	title: async ( { params }: { params: { id: string } } ) => {
		const attachmentId = getAttachmentId( params.id );
		const attachment = await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			'attachment',
			attachmentId
		);

		return attachment
			? getAttachmentTitle( attachment )
			: __( 'Edit media' );
	},
};
