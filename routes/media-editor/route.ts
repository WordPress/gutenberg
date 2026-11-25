import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { notFound } from '@wordpress/route';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * The stage only renders a form, so it requests the `form` of the entity view
 * configuration alone. Must match the fields the stage requests, so both
 * resolve under the same cache key.
 */
const VIEW_CONFIG_FIELDS = 'form';

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
		// The content reads the editor's globals as soon as it loads.
		const { loadEditorAssets } = await import( '@wordpress/lazy-editor' );
		await loadEditorAssets();

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
	loader: async () => {
		// Resolve the fields and the form the stage renders. A failure is not
		// fatal: the stage reports a failure to load the fields, and the editor
		// falls back to its default form, so neither blocks the route.
		// Imported here: this module loads before the editor assets that bring
		// `wp-editor`, and a static import would read its global then.
		const { store: editorStore } = await import( '@wordpress/editor' );
		await Promise.all( [
			unlock( resolveSelect( editorStore ) )
				.getEntityFields( 'postType', 'attachment' )
				.catch( () => {} ),
			unlock( resolveSelect( coreStore ) )
				.getViewConfig( 'postType', 'attachment', {
					fields: VIEW_CONFIG_FIELDS,
				} )
				.catch( () => {} ),
		] );
	},
	title: async ( { params }: { params: { id: string } } ) => {
		const attachmentId = getAttachmentId( params.id );
		const attachment = ( await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			'attachment',
			attachmentId
		) ) as
			| { title?: string | { rendered?: string; raw?: string } }
			| undefined;

		return attachment
			? getAttachmentTitle( attachment )
			: __( 'Edit media' );
	},
};
