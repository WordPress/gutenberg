/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

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

function SectionBlockControls( { blockName, clientId, contentClientIds } ) {
	const settings = useBlockSettings( blockName );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { hasButton, hasHeading } = useSelect(
		( select ) => {
			const { getBlockName } = select( blockEditorStore );
			let foundButton = false;
			let foundHeading = false;

			for ( const contentClientId of contentClientIds ) {
				const name = getBlockName( contentClientId );
				if ( name === 'core/heading' ) {
					foundHeading = true;
				}
				if ( name === 'core/button' ) {
					foundButton = true;
				}

				if ( foundHeading && foundButton ) {
					break;
				}
			}

			return {
				hasButton: foundButton,
				hasHeading: foundHeading,
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
				button: hasButton,
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
					contentClientIds={ contentClientIds }
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
