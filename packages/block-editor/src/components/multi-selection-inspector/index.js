/**
 * WordPress dependencies
 */
import { sprintf, _n, __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { serialize } from '@wordpress/blocks';
import { count as wordCount } from '@wordpress/wordcount';
import { copy } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { store as blockEditorStore } from '../../store';
import { useBorderPanelLabel } from '../../hooks/border';
import useInspectorControlsTabs from '../inspector-controls-tabs/use-inspector-controls-tabs';
import { default as InspectorControls } from '../inspector-controls';
import { default as InspectorControlsTabs } from '../inspector-controls-tabs';

export function MultiSelectionControls( { blockType, blockName } ) {
	const availableTabs = useInspectorControlsTabs( blockType?.name );
	const showTabs = availableTabs?.length > 1;
	const borderPanelLabel = useBorderPanelLabel( {
		blockName,
	} );

	return showTabs ? (
		<InspectorControlsTabs tabs={ availableTabs } />
	) : (
		<>
			<InspectorControls.Slot />
			<InspectorControls.Slot
				group="color"
				label={ __( 'Color' ) }
				className="color-block-support-panel__inner-wrapper"
			/>
			<InspectorControls.Slot
				group="typography"
				label={ __( 'Typography' ) }
			/>
			<InspectorControls.Slot
				group="dimensions"
				label={ __( 'Dimensions' ) }
			/>
			<InspectorControls.Slot group="border" label={ borderPanelLabel } />
			<InspectorControls.Slot group="styles" />
		</>
	);
}

export default function MultiSelectionInspector() {
	const { blocks } = useSelect( ( select ) => {
		const { getMultiSelectedBlocks } = select( blockEditorStore );
		return {
			blocks: getMultiSelectedBlocks(),
		};
	}, [] );
	const words = wordCount( serialize( blocks ), 'words' );

	return (
		<div className="block-editor-multi-selection-inspector__card">
			<BlockIcon icon={ copy } showColors />
			<div className="block-editor-multi-selection-inspector__card-content">
				<div className="block-editor-multi-selection-inspector__card-title">
					{ sprintf(
						/* translators: %d: number of blocks */
						_n( '%d Block', '%d Blocks', blocks.length ),
						blocks.length
					) }
				</div>
				<div className="block-editor-multi-selection-inspector__card-description">
					{ sprintf(
						/* translators: %d: number of words */
						_n( '%d word selected.', '%d words selected.', words ),
						words
					) }
				</div>
			</div>
		</div>
	);
}
