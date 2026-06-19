/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import InspectorControls from '../inspector-controls';
import PositionControls from './position-controls-panel';
import { useBorderPanelLabel } from '../../hooks/border';
import { useBlockSettings } from '../../hooks/utils';
import { store as blockEditorStore } from '../../store';
import { ColorEdit } from '../../hooks/color';
import { ColorToolsPanel } from '../global-styles/color-panel';

function SectionBlockColorControls( {
	blockName,
	clientId,
	contentClientIds,
} ) {
	const settings = useBlockSettings( blockName );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { hasButtons, hasHeading } = useSelect(
		( select ) => {
			const blockNames =
				select( blockEditorStore ).getBlockNamesByClientId(
					contentClientIds
				);
			return {
				hasButtons: blockNames.includes( 'core/buttons' ),
				hasHeading: blockNames.includes( 'core/heading' ),
			};
		},
		[ contentClientIds ]
	);

	const setAttributes = ( newAttributes ) => {
		updateBlockAttributes( clientId, newAttributes );
	};

	return (
		<ColorEdit
			clientId={ clientId }
			name={ blockName }
			settings={ settings }
			setAttributes={ setAttributes }
			asWrapper={ ColorToolsPanel }
			label={ __( 'Color' ) }
			defaultControls={ {
				text: true,
				background: true,
				button: hasButtons,
				heading: hasHeading,
			} }
		/>
	);
}

const StylesTab = ( {
	blockName,
	clientId,
	hasBlockStyles,
	isSectionBlock,
	contentClientIds,
} ) => {
	const borderPanelLabel = useBorderPanelLabel( { blockName } );

	return (
		<>
			{ hasBlockStyles && <BlockStyles clientId={ clientId } /> }
			{ isSectionBlock && (
				<SectionBlockColorControls
					blockName={ blockName }
					clientId={ clientId }
					contentClientIds={ contentClientIds }
				/>
			) }
			{
				// Extenders have in the past always been allowed to add controls to group
				// the restrictions are lessened for that block.
			 }
			{ ( ! isSectionBlock || blockName === 'core/template-part' ) && (
				<>
					<InspectorControls.Slot
						group="color"
						label={ __( 'Color' ) }
						className="color-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot
						group="background"
						label={ __( 'Background image' ) }
						className="background-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot group="filter" />
					<InspectorControls.Slot
						group="typography"
						label={ __( 'Typography' ) }
					/>
					<InspectorControls.Slot
						group="layout"
						label={ __( 'Layout' ) }
					/>
					<InspectorControls.Slot
						group="dimensions"
						label={ __( 'Dimensions' ) }
					/>
					<InspectorControls.Slot
						group="border"
						label={ borderPanelLabel }
					/>
					<PositionControls />
					<InspectorControls.Slot group="styles" />
				</>
			) }
		</>
	);
};

export default StylesTab;
