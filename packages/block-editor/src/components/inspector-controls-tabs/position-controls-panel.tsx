import {
	__experimentalUseSlotFills as useSlotFills,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import InspectorControlsGroups from '../inspector-controls/groups';
import { default as InspectorControls } from '../inspector-controls';
import BlockSupportSlotContainer from '../inspector-controls/block-support-slot-container';
import { store as blockEditorStore } from '../../store';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { cleanEmptyObject } from '../../hooks/utils';
import { unlock } from '../../lock-unlock';
import type { TreeBlock } from '../../store/types';
import type { BlockStyleState } from '../../hooks/types';
import type { PositionStyleAttribute } from './types';
import type { BlockSupportResetAllFilter } from '../inspector-controls/types';

const DEFAULT_STATE_VALUE = 'default';

/**
 * Returns the viewport key a selected block style state targets for position
 * controls, or `null` for the default (desktop) state. Position doesn't
 * support pseudo states, so those are treated as the default state.
 *
 * @param selectedState Value returned by `getSelectedBlockStyleState`.
 * @return Viewport key, or `null` for the default state.
 */
const getPositionStateViewport = (
	selectedState: BlockStyleState | undefined
): string | null =>
	selectedState?.viewport &&
	selectedState.viewport !== DEFAULT_STATE_VALUE &&
	( ! selectedState.pseudo || selectedState.pseudo === DEFAULT_STATE_VALUE )
		? selectedState.viewport
		: null;

/**
 * Checks whether a style object has a position value in the default state or
 * any viewport state.
 *
 * @param style Block style attributes.
 * @return Whether a position value is set.
 */
const hasAnyPositionValue = ( style?: PositionStyleAttribute ): boolean => {
	if ( style?.position?.type ) {
		return true;
	}
	return Object.entries( style ?? {} ).some(
		( [ key, stateStyle ] ) =>
			key.startsWith( '@' ) &&
			// Viewport states hold style objects.
			!! ( stateStyle as PositionStyleAttribute | undefined )?.position
				?.type
	);
};

const PositionControlsPanel = ( {
	hasPositionFills,
}: {
	hasPositionFills: boolean;
} ) => {
	const { selectedClientIds, selectedBlocks, hasPositionAttribute } =
		useSelect( ( select ) => {
			const { getBlocksByClientId, getSelectedBlockClientIds } =
				select( blockEditorStore );

			const selectedBlockClientIds = getSelectedBlockClientIds();
			// The selected blocks exist.
			const _selectedBlocks = getBlocksByClientId(
				selectedBlockClientIds
			) as TreeBlock[];

			return {
				selectedClientIds: selectedBlockClientIds,
				selectedBlocks: _selectedBlocks,
				hasPositionAttribute: _selectedBlocks?.some(
					( { attributes } ) =>
						// The style attribute is an object.
						hasAnyPositionValue(
							attributes?.style as
								PositionStyleAttribute | undefined
						)
				),
			};
		}, [] );

	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	function resetPosition( resetFilters: BlockSupportResetAllFilter[] = [] ) {
		if ( ! selectedClientIds?.length || ! selectedBlocks?.length ) {
			return;
		}

		const { getSelectedBlockStyleState } = unlock(
			registry.select( blockEditorStore )
		);
		const attributesByClientId = Object.fromEntries(
			selectedBlocks?.map( ( { clientId, attributes } ) => {
				let updatedAttributes: Record< string, unknown > = {
					style: attributes?.style,
				};
				const resetContext = {
					attributes,
					clientId,
					name: registry
						.select( blockEditorStore )
						.getBlockName( clientId ),
				};
				resetFilters.forEach( ( resetFilter ) => {
					updatedAttributes = {
						...updatedAttributes,
						...resetFilter( updatedAttributes, resetContext ),
					};
				} );
				if ( ! hasPositionFills ) {
					return [ clientId, updatedAttributes ];
				}
				const viewport = getPositionStateViewport(
					getSelectedBlockStyleState( clientId )
				);
				const style: PositionStyleAttribute = {
					// The style attribute is an object.
					...( updatedAttributes.style as
						PositionStyleAttribute | undefined ),
				};

				if ( viewport ) {
					/*
					 * Explicitly clear the position for this viewport.
					 */
					style[ viewport ] = {
						// Viewport states hold style objects.
						...( style[ viewport ] as
							PositionStyleAttribute | undefined ),
						position: {
							type: '',
							top: undefined,
							right: undefined,
							bottom: undefined,
							left: undefined,
						},
					};
				} else {
					style.position = {
						...style.position,
						type: undefined,
						top: undefined,
						right: undefined,
						bottom: undefined,
						left: undefined,
					};
				}

				return [
					clientId,
					{ ...updatedAttributes, style: cleanEmptyObject( style ) },
				];
			} )
		);

		updateBlockAttributes( selectedClientIds, attributesByClientId, true );
	}

	return (
		<ToolsPanel
			className="block-editor-block-inspector__position"
			label={ __( 'Position' ) }
			resetAll={ resetPosition }
			panelId={
				selectedClientIds.length === 1 ? selectedClientIds[ 0 ] : null
			}
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ hasPositionFills && (
				<ToolsPanelItem
					isShownByDefault={ hasPositionAttribute }
					label={ __( 'Position' ) }
					hasValue={ () => hasPositionAttribute }
					onDeselect={ () => resetPosition() }
					panelId={
						selectedClientIds.length === 1
							? selectedClientIds[ 0 ]
							: undefined
					}
				>
					<InspectorControls.Slot group="position" />
				</ToolsPanelItem>
			) }
			<BlockSupportSlotContainer
				Slot={ InspectorControlsGroups[ 'position-tools' ].Slot }
			/>
		</ToolsPanel>
	);
};

const PositionControls = () => {
	const fills = useSlotFills( InspectorControlsGroups.position.name );
	const toolFills = useSlotFills(
		InspectorControlsGroups[ 'position-tools' ].name
	);
	const hasFills = Boolean( fills && fills.length );

	if ( ! hasFills && ! toolFills?.length ) {
		return null;
	}

	return <PositionControlsPanel hasPositionFills={ hasFills } />;
};

export default PositionControls;
