/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useTemplatePartEntity( theme, slug, blockArea ) {
	// Replicates `createTemplatePartId` in the template part block.
	// TODO: refactor it.
	const templatePartId = theme && slug ? theme + '//' + slug : null;

	return useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				getEntityRecords,
				hasFinishedResolution,
			} = select( coreStore );

			const getEntityArgs = [
				'postType',
				'wp_template_part',
				templatePartId,
			];
			const entityRecord = templatePartId
				? getEditedEntityRecord( ...getEntityArgs )
				: null;

			const _area = entityRecord?.area || blockArea;

			// Check whether other entities exist for switching/selection.
			const availableReplacementArgs = [
				'postType',
				'wp_template_part',
				_area && 'uncategorized' !== _area && { area: _area },
			];
			const matchingReplacements = getEntityRecords(
				...availableReplacementArgs
			);
			const _enableSelection = templatePartId
				? matchingReplacements?.length > 1
				: matchingReplacements?.length > 0;

			const hasResolvedEntity = templatePartId
				? hasFinishedResolution(
						'getEditedEntityRecord',
						getEntityArgs
				  )
				: false;

			return {
				isResolved: hasResolvedEntity,
				isMissing: hasResolvedEntity && ! entityRecord,
				area: _area,
				enableSelection: _enableSelection,
				hasResolvedReplacements: hasFinishedResolution(
					'getEntityRecords',
					availableReplacementArgs
				),
			};
		},
		[ templatePartId, blockArea ]
	);
}
