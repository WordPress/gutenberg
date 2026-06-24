/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import InspectorControls from '../inspector-controls';
import PositionControls from './position-controls-panel';
import { useBorderPanelLabel } from '../../hooks/border';
import { useBlockSettings } from '../../hooks/utils';
import { store as blockEditorStore } from '../../store';
import { ElementsEdit } from '../../hooks/elements';
import { TypographyPanel } from '../../hooks/typography';
import { BackgroundImagePanel } from '../../hooks/background';
import { ColorToolsPanel } from '../global-styles/color-panel';
import { TypographyToolsPanel } from '../global-styles/typography-panel';
import { BackgroundToolsPanel } from '../global-styles/background-panel';

// Section blocks present a curated subset of the normal block style panels.
// Their block-support fills are gated off by editing mode (see
// `BlockStyleControls` in hooks/style.js), so each panel is direct-rendered
// here rather than via the inspector slots, with settings restricted to the
// supports a section should expose:
// - Typography: text color only (font controls disabled).
// - Background: color + gradient only (image controls disabled).
// - Elements: link/heading/button/caption colors (unchanged).
function SectionStyleControls( { blockName, clientId, contentClientIds } ) {
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

	const typographySettings = useMemo(
		() => ( { ...settings, typography: {} } ),
		[ settings ]
	);
	const backgroundSettings = useMemo(
		() => ( {
			...settings,
			background: {
				...settings.background,
				backgroundImage: false,
				backgroundSize: false,
			},
		} ),
		[ settings ]
	);

	return (
		<>
			<TypographyPanel
				clientId={ clientId }
				name={ blockName }
				settings={ typographySettings }
				setAttributes={ setAttributes }
				asWrapper={ TypographyToolsPanel }
			/>
			<BackgroundImagePanel
				clientId={ clientId }
				name={ blockName }
				settings={ backgroundSettings }
				setAttributes={ setAttributes }
				asWrapper={ BackgroundToolsPanel }
			/>
			<ElementsEdit
				clientId={ clientId }
				name={ blockName }
				settings={ settings }
				setAttributes={ setAttributes }
				asWrapper={ ColorToolsPanel }
				label={ __( 'Elements' ) }
				defaultControls={ {
					button: hasButtons,
					heading: hasHeading,
				} }
			/>
		</>
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
			{ isSectionBlock && blockName !== 'core/template-part' && (
				<SectionStyleControls
					blockName={ blockName }
					clientId={ clientId }
					contentClientIds={ contentClientIds }
				/>
			) }
			{
				// Extenders have in the past always been allowed to add controls to group
				// the restrictions are lessened for that block. Template parts are
				// excluded from the curated section controls above and fall through
				// to the full panel set here.
			 }
			{ ( ! isSectionBlock || blockName === 'core/template-part' ) && (
				<>
					<InspectorControls.Slot
						group="typography"
						label={ __( 'Typography' ) }
					/>
					<InspectorControls.Slot
						group="color"
						label={ __( 'Color' ) }
						className="color-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot
						group="background"
						label={ __( 'Background' ) }
						className="background-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot group="filter" />
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
					<InspectorControls.Slot
						group="elements"
						label={ __( 'Elements' ) }
						className="elements-block-support-panel__inner-wrapper"
					/>
					<PositionControls />
					<InspectorControls.Slot group="styles" />
				</>
			) }
		</>
	);
};

export default StylesTab;
