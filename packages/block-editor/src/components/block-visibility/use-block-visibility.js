/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import {
	isHiddenForViewport,
	hasAnyVisibilitySettings,
	getToggledVisibility,
} from './utils';

/**
 * Hook for managing block visibility state and actions.
 *
 * @param {string[]} clientIds Array of block client IDs.
 * @return {Object} Block visibility state and actions.
 */
export default function useBlockVisibility( clientIds ) {
	const { blocks, canToggle, viewportType, responsiveEditing } = useSelect(
		( select ) => {
			const { getBlockName, getBlocksByClientId, getSettings } =
				select( blockEditorStore );
			const _blocks = getBlocksByClientId( clientIds );
			const settings = getSettings();
			return {
				blocks: _blocks,
				canToggle: _blocks.every( ( { clientId } ) =>
					hasBlockSupport(
						getBlockName( clientId ),
						'visibility',
						true
					)
				),
				viewportType: settings.__experimentalDeviceType ?? 'Desktop',
				responsiveEditing:
					settings.__experimentalResponsiveEditing ?? false,
			};
		},
		[ clientIds ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const isHidden = responsiveEditing
		? blocks.some( ( block ) =>
				isHiddenForViewport(
					block.attributes.metadata?.blockVisibility,
					viewportType
				)
		  )
		: blocks.some( ( block ) =>
				hasAnyVisibilitySettings(
					block.attributes.metadata?.blockVisibility
				)
		  );

	const toggleVisibility = () => {
		const attributesByClientId = Object.fromEntries(
			blocks?.map( ( { clientId, attributes } ) => {
				const currentVisibility = attributes?.metadata?.blockVisibility;

				let visibility;
				if ( responsiveEditing ) {
					const currentlyHidden = isHiddenForViewport(
						currentVisibility,
						viewportType
					);
					visibility = getToggledVisibility(
						currentVisibility,
						viewportType,
						currentlyHidden
					);
				} else {
					visibility = hasAnyVisibilitySettings( currentVisibility )
						? undefined
						: false;
				}

				return [
					clientId,
					{
						metadata: {
							...attributes?.metadata,
							blockVisibility: visibility,
						},
					},
				];
			} )
		);

		updateBlockAttributes( clientIds, attributesByClientId, {
			uniqueByBlock: true,
		} );
	};

	return {
		blocks,
		canToggle,
		isHidden,
		viewportType,
		responsiveEditing,
		toggleVisibility,
	};
}
