/**
 * WordPress dependencies
 */
import { trash } from '@wordpress/icons';
import { __, _n } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch, select as storeSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function MosaicViewBatchDeleteButton() {
	const { selectedTemplates } = useSelect( ( select ) => {
		const { getSelectedTemplates } = select( editSiteStore );
		return {
			selectedTemplates: getSelectedTemplates(),
		};
	} );
	const { revertTemplate, toggleSelectedTemplate } = useDispatch(
		editSiteStore
	);
	const { deleteEntityRecord } = useDispatch( coreStore );
	return (
		<Button
			onClick={ () => {
				if (
					// eslint-disable-next-line no-alert
					window.confirm(
						_n(
							'Are you sure you want to delete or clear the customizations from the selected templates?',
							'Are you sure you want to delete or clear the customizations from the selected template?',
							selectedTemplates.length
						)
					)
				) {
					for ( const templateId of selectedTemplates ) {
						const template = storeSelect(
							coreStore
						).getEntityRecord(
							'postType',
							'wp_template',
							templateId
						);
						if ( template.has_theme_file ) {
							revertTemplate( template );
						} else {
							deleteEntityRecord(
								'postType',
								'wp_template',
								templateId
							);
						}
						toggleSelectedTemplate( templateId );
					}
				}
			} }
			isDestructive
			icon={ trash }
			label={ __(
				'Delete and remove customizations from selected templates'
			) }
		/>
	);
}
