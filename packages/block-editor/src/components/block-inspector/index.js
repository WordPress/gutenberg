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
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockCard from '../block-card';
import {
	default as InspectorControls,
	InspectorAdvancedControls,
} from '../inspector-controls';
import BlockStyles from '../block-styles';
import MultiSelectionInspector from '../multi-selection-inspector';
import DefaultStylePicker from '../default-style-picker';
import BlockVariationTransforms from '../block-variation-transforms';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';

const BlockInspector = ( { showNoBlockSelectedMessage = true } ) => {
	const {
		count,
		hasBlockStyles,
		selectedBlockName,
		selectedBlockClientId,
		blockType,
	} = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getSelectedBlockCount,
			getBlockName,
		} = select( blockEditorStore );
		const { getBlockStyles } = select( blocksStore );

		const _selectedBlockClientId = getSelectedBlockClientId();
		const _selectedBlockName =
			_selectedBlockClientId && getBlockName( _selectedBlockClientId );
		const _blockType =
			_selectedBlockName && getBlockType( _selectedBlockName );
		const blockStyles =
			_selectedBlockName && getBlockStyles( _selectedBlockName );

		return {
			count: getSelectedBlockCount(),
			selectedBlockClientId: _selectedBlockClientId,
			selectedBlockName: _selectedBlockName,
			blockType: _blockType,
			hasBlockStyles: blockStyles && blockStyles.length > 0,
		};
	}, [] );

	if ( count > 1 ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
				<InspectorControls.Slot />
				<InspectorControls.Slot
					__experimentalGroup="typography"
					label={ __( 'Typography' ) }
				/>
				<InspectorControls.Slot
					__experimentalGroup="dimensions"
					label={ __( 'Dimensions' ) }
				/>
				<InspectorControls.Slot
					__experimentalGroup="border"
					label={ __( 'Border' ) }
				/>
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
		/>
	);
};

const BlockInspectorSingleBlock = ( {
	clientId,
	blockName,
	hasBlockStyles,
} ) => {
	const blockInformation = useBlockDisplayInformation( clientId );
	return (
		<div className="block-editor-block-inspector">
			<BlockCard { ...blockInformation } />
			<BlockVariationTransforms blockClientId={ clientId } />
			{ hasBlockStyles && (
				<div>
					<PanelBody title={ __( 'Styles' ) }>
						<BlockStyles
							scope="core/block-inspector"
							clientId={ clientId }
						/>
						{ hasBlockSupport(
							blockName,
							'defaultStylePicker',
							true
						) && <DefaultStylePicker blockName={ blockName } /> }
					</PanelBody>
				</div>
			) }
			<InspectorControls.Slot />
			<InspectorControls.Slot
				__experimentalGroup="typography"
				label={ __( 'Typography' ) }
			/>
			<InspectorControls.Slot
				__experimentalGroup="dimensions"
				label={ __( 'Dimensions' ) }
			/>
			<InspectorControls.Slot
				__experimentalGroup="border"
				label={ __( 'Border' ) }
			/>
			<div>
				<AdvancedControls />
			</div>
			<SkipToSelectedBlock key="back" />
		</div>
	);
};

const AdvancedControls = () => {
	const slot = useSlot( InspectorAdvancedControls.slotName );
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
			<InspectorControls.Slot __experimentalGroup="advanced" />
		</PanelBody>
	);
};

export default BlockInspector;
