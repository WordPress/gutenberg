/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */

// TODO: this util should perhaps be refactored somewhere like core-data.
import { createTemplatePartId } from '../template-part/edit/utils/create-template-part-id';
import { getTemplatePartIcon } from '../template-part/edit/utils/get-template-part-icon';

export default function useTemplatePartAreaLabel( clientId ) {
	return useSelect(
		( select ) => {
			// Use the lack of a clientId as an opportunity to bypass the rest
			// of this hook.
			if ( ! clientId ) {
				return;
			}

			const { getBlock, getBlockParentsByBlockName } =
				select( blockEditorStore );

			const withAscendingResults = true;
			const parentTemplatePartClientIds = getBlockParentsByBlockName(
				clientId,
				'core/template-part',
				withAscendingResults
			);

			if ( ! parentTemplatePartClientIds?.length ) {
				return;
			}

			const { getCurrentTheme, getEditedEntityRecord } =
				select( coreStore );

			const currentTheme = getCurrentTheme();
			const defaultTemplatePartAreas =
				currentTheme?.default_template_part_areas || [];

			const definedAreas = defaultTemplatePartAreas.map( ( item ) => ( {
				...item,
				icon: getTemplatePartIcon( item.icon ),
			} ) );

			for ( const templatePartClientId of parentTemplatePartClientIds ) {
				const templatePartBlock = getBlock( templatePartClientId );

				// The 'area' usually isn't stored on the block, but instead
				// on the entity.
				const { theme = currentTheme?.stylesheet, slug } =
					templatePartBlock.attributes;
				const templatePartEntityId = createTemplatePartId(
					theme,
					slug
				);
				const templatePartEntity = getEditedEntityRecord(
					'postType',
					'wp_template_part',
					templatePartEntityId
				);

				// Look up the `label` for the area in the defined areas so
				// that an internationalized label can be used.
				if ( templatePartEntity?.area ) {
					return definedAreas.find(
						( definedArea ) =>
							definedArea.area !== 'uncategorized' &&
							definedArea.area === templatePartEntity.area
					)?.label;
				}
			}
		},
		[ clientId ]
	);
}
