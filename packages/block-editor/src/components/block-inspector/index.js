/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockType,
	getUnregisteredTypeHandlerName,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	PanelBody,
	__experimentalUseSlot as useSlot,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockCard from '../block-card';
import InspectorControls from '../inspector-controls';
import InspectorAdvancedControls from '../inspector-advanced-controls';
import BlockStyles from '../block-styles';
import MultiSelectionInspector from '../multi-selection-inspector';
import DefaultStylePicker from '../default-style-picker';
import BlockVariationTransforms from '../block-variation-transforms';
import useBlockDisplayInformation from '../use-block-display-information';

const BlockInspector = ( {
	blockType,
	count,
	hasBlockStyles,
	selectedBlockClientId,
	selectedBlockName,
	showNoBlockSelectedMessage = true,
	bubblesVirtually = true,
} ) => {
	if ( count > 1 ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
				<InspectorControls.Slot bubblesVirtually={ bubblesVirtually } />
			</div>
		);
	}

	const isSelectedBlockUnregistered =
		selectedBlockName === getUnregisteredTypeHandlerName();

	/*
	 * If the selected block is of an unregistered type, avoid showing it as an actual selection
	 * because we want the user to focus on the unregistered block warning, not block settings.
	 */
	if (
		! blockType ||
		! selectedBlockClientId ||
		isSelectedBlockUnregistered
	) {
		if ( showNoBlockSelectedMessage ) {
			return (
				<span className="block-editor-block-inspector__no-blocks">
					{ __( 'No block selected.' ) }
				</span>
			);
		}
		return null;
	}
	return (
		<BlockInspectorSingleBlock
			clientId={ selectedBlockClientId }
			blockName={ blockType.name }
			hasBlockStyles={ hasBlockStyles }
			bubblesVirtually={ bubblesVirtually }
		/>
	);
};

const BlockInspectorSingleBlock = ( {
	clientId,
	blockName,
	hasBlockStyles,
	bubblesVirtually,
} ) => {
	const blockInformation = useBlockDisplayInformation( clientId );
	return (
		<div className="block-editor-block-inspector">
			<BlockCard { ...blockInformation } />
			<BlockVariationTransforms blockClientId={ clientId } />
			{ hasBlockStyles && (
				<div>
					<PanelBody title={ __( 'Styles' ) }>
						<BlockStyles clientId={ clientId } />
						{ hasBlockSupport(
							blockName,
							'defaultStylePicker',
							true
						) && <DefaultStylePicker blockName={ blockName } /> }
					</PanelBody>
				</div>
			) }
			<InspectorControls.Slot bubblesVirtually={ bubblesVirtually } />
			<div>
				<AdvancedControls
					slotName={ InspectorAdvancedControls.slotName }
					bubblesVirtually={ bubblesVirtually }
				/>
			</div>
			<SkipToSelectedBlock key="back" />
		</div>
	);
};

const AdvancedControls = ( { slotName, bubblesVirtually } ) => {
	const slot = useSlot( slotName );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__advanced"
			title={ __( 'Advanced' ) }
			initialOpen={ false }
		>
			<InspectorAdvancedControls.Slot
				bubblesVirtually={ bubblesVirtually }
			/>
		</PanelBody>
	);
};

export default withSelect( ( select ) => {
	const {
		getSelectedBlockClientId,
		getSelectedBlockCount,
		getBlockName,
	} = select( 'core/block-editor' );
	const { getBlockStyles } = select( blocksStore );
	const selectedBlockClientId = getSelectedBlockClientId();
	const selectedBlockName =
		selectedBlockClientId && getBlockName( selectedBlockClientId );
	const blockType =
		selectedBlockClientId && getBlockType( selectedBlockName );
	const blockStyles =
		selectedBlockClientId && getBlockStyles( selectedBlockName );
	return {
		count: getSelectedBlockCount(),
		hasBlockStyles: blockStyles && blockStyles.length > 0,
		selectedBlockName,
		selectedBlockClientId,
		blockType,
	};
} )( BlockInspector );
