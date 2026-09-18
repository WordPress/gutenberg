import {
	__experimentalUseSlotFills as useSlotFills,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import InspectorControlsGroups from '../inspector-controls/groups';
import { default as InspectorControls } from '../inspector-controls';
import { store as blockEditorStore } from '../../store';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { cleanEmptyObject } from '../../hooks/utils';
import { unlock } from '../../lock-unlock';

const DEFAULT_STATE_VALUE = 'default';

/**
 * Returns the viewport key a selected block style state targets for position
 * controls, or `null` for the default (desktop) state. Position doesn't
 * support pseudo states, so those are treated as the default state.
 *
 * @param {Object} selectedState Value returned by `getSelectedBlockStyleState`.
 * @return {string|null} Viewport key, or `null` for the default state.
 */
const getPositionStateViewport = ( selectedState ) =>
	selectedState?.viewport &&
	selectedState.viewport !== DEFAULT_STATE_VALUE &&
	( ! selectedState.pseudo || selectedState.pseudo === DEFAULT_STATE_VALUE )
		? selectedState.viewport
		: null;

/**
 * Checks whether a style object has a position value in the default state or
 * any viewport state.
 *
 * @param {Object} style Block style attributes.
 * @return {boolean} Whether a position value is set.
 */
const hasAnyPositionValue = ( style ) => {
	if ( style?.position?.type ) {
		return true;
	}
	return Object.entries( style ?? {} ).some(
		( [ key, stateStyle ] ) =>
			key.startsWith( '@' ) && !! stateStyle?.position?.type
	);
};

const PositionControlsPanel = () => {
	const {
		selectedClientIds,
		selectedBlocks,
		selectedStateViewports,
		hasPositionAttribute,
	} = useSelect( ( select ) => {
		const {
			getBlocksByClientId,
			getSelectedBlockClientIds,
			getSelectedBlockStyleState,
		} = unlock( select( blockEditorStore ) );

		const selectedBlockClientIds = getSelectedBlockClientIds();
		const _selectedBlocks = getBlocksByClientId( selectedBlockClientIds );

		return {
			selectedClientIds: selectedBlockClientIds,
			selectedBlocks: _selectedBlocks,
			selectedStateViewports: Object.fromEntries(
				selectedBlockClientIds.map( ( clientId ) => [
					clientId,
					getPositionStateViewport(
						getSelectedBlockStyleState( clientId )
					),
				] )
			),
			hasPositionAttribute: _selectedBlocks?.some( ( { attributes } ) =>
				hasAnyPositionValue( attributes?.style )
			),
		};
	}, [] );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	function resetPosition() {
		if ( ! selectedClientIds?.length || ! selectedBlocks?.length ) {
			return;
		}

		const attributesByClientId = Object.fromEntries(
			selectedBlocks?.map( ( { clientId, attributes } ) => {
				const viewport = selectedStateViewports[ clientId ];
				const style = { ...attributes?.style };

				if ( viewport ) {
					/*
					 * Explicitly clear the position for this viewport.
					 */
					style[ viewport ] = {
						...style[ viewport ],
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

				return [ clientId, { style: cleanEmptyObject( style ) } ];
			} )
		);

		updateBlockAttributes( selectedClientIds, attributesByClientId, true );
	}

	return (
		<ToolsPanel
			className="block-editor-block-inspector__position"
			label={ __( 'Position' ) }
			resetAll={ resetPosition }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				isShownByDefault={ hasPositionAttribute }
				label={ __( 'Position' ) }
				hasValue={ () => hasPositionAttribute }
				onDeselect={ resetPosition }
			>
				<InspectorControls.Slot group="position" />
			</ToolsPanelItem>
		</ToolsPanel>
	);
};

const PositionControls = () => {
	const fills = useSlotFills( InspectorControlsGroups.position.name );
	const hasFills = Boolean( fills && fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return <PositionControlsPanel />;
};

export default PositionControls;
