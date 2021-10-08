/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useTemplatePartEntity( templatePartId, areaAttribute ) {
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

			const _area = entityRecord?.area || areaAttribute;

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
		[ templatePartId, areaAttribute ]
	);
}
