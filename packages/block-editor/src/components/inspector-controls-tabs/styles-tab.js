/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import InspectorControls from '../inspector-controls';
import { useBorderPanelLabel } from '../../hooks/border';
import { useBlockSettings } from '../../hooks/utils';
import { store as blockEditorStore } from '../../store';
import { ColorEdit } from '../../hooks/color';
import { ColorToolsPanel } from '../global-styles/color-panel';

function SectionBlockControls( { blockName, clientId } ) {
	const settings = useBlockSettings( blockName );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const setAttributes = ( newAttributes ) => {
		updateBlockAttributes( clientId, newAttributes );
	};

	// This is needed to force the captions setting to show
	// but there's probably a right way to do it.
	const newSettings = { ...settings };
	newSettings.color.caption = true;

	return (
		<ColorEdit
			clientId={ clientId }
			name={ blockName }
			settings={ newSettings }
			setAttributes={ setAttributes }
			asWrapper={ ColorToolsPanel }
			label={ __( 'Color' ) }
			defaultControls={ {
				// TODO - this is duplicated in packages/block-editor/src/components/global-styles/color-panel.js
				text: true,
				background: true,
				link: true,
				heading: true,
				button: true,
				caption: true,
			} }
		/>
	);
}

const StylesTab = ( {
	blockName,
	clientId,
	hasBlockStyles,
	isSectionBlock,
} ) => {
	const borderPanelLabel = useBorderPanelLabel( { blockName } );

	return (
		<>
			{ hasBlockStyles && (
				<div>
					<PanelBody title={ __( 'Styles' ) }>
						<BlockStyles clientId={ clientId } />
					</PanelBody>
				</div>
			) }
			{ isSectionBlock && (
				<SectionBlockControls
					blockName={ blockName }
					clientId={ clientId }
				/>
			) }
			{ ! isSectionBlock && (
				<>
					<InspectorControls.Slot
						group="color"
						label={ __( 'Color' ) }
						className="color-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot
						group="background"
						label={ __( 'Background image' ) }
					/>
					<InspectorControls.Slot group="filter" />
					<InspectorControls.Slot
						group="typography"
						label={ __( 'Typography' ) }
					/>
					<InspectorControls.Slot
						group="dimensions"
						label={ __( 'Dimensions' ) }
					/>
					<InspectorControls.Slot
						group="border"
						label={ borderPanelLabel }
					/>
					<InspectorControls.Slot group="styles" />
				</>
			) }
		</>
	);
};

export default StylesTab;
