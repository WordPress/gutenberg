/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import Page from '../page';

const EMPTY_ARRAY = [];
export default function PageMedia() {
	const { attachments } = useSelect(
		( select ) => {
			const _attachments = select( coreStore ).getEntityRecords(
				'postType',
				'attachment',
				{ per_page: 50 }
			);
			return {
				attachments: _attachments || EMPTY_ARRAY,
			};
		}, [] );

	return (
		<Page
			className="edit-site-media"
			title={ __( 'Media' ) }
			hideTitleFromUI
		>
			{ __( 'Media library list component stuff goes here' ) }
			{ attachments.map( ( attachment ) => (
				<figure key={ attachment.id }>
					<img src={ attachment.source_url } alt={ attachment.alt_text } />
					<figcaption>{ attachment.title.raw }</figcaption>
				</figure>
			) ) }
		</Page>
	);
}
