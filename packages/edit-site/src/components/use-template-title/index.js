/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

function useTemplateTitle( templateType, templateId ) {
	return useSelect(
		( select ) => {
			const { getEditedEntityRecord } = select( coreStore );
			const { __experimentalGetTemplateInfo: getTemplateInfo } = select(
				editorStore
			);
			const record = getEditedEntityRecord(
				'postType',
				templateType,
				templateId
			);

			return 'wp_template' === templateType
				? getTemplateInfo( record ).title
				: record?.slug;
		},
		[ templateType, templateId ]
	);
}

export default useTemplateTitle;
