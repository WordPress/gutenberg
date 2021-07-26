/**
 * WordPress dependencies
 */
 import { useSelect } from '@wordpress/data';
 import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import TemplatePreview from './template-preview';

export default function MosaicView() {
	const { templates } = useSelect( ( select ) => {
		const { getEntityRecords, getEditedEntityRecord } = select( coreStore );
		return {
			templates: getEntityRecords( 'postType', 'wp_template', {
				per_page: -1,
			} )
		};
	}, [] );
	if ( ! templates ) {
		return null;
	}
	return (
		<div className="edit-site-mosaic-view">
			{
				templates.map( ( template ) => {
					return (
						<div className="edit-site-mosaic-view__mosaic-item">
							<TemplatePreview key={ template.id } templateId={ template.id } />
						</div>
					);
				} )
			}
		</div>
	);
}
