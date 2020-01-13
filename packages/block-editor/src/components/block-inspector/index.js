/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockType, getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import {
	PanelBody,
	__experimentalSlotFillConsumer,
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
const BlockInspector = ( {
	blockType,
	count,
	hasBlockStyles,
	selectedBlockClientId,
	selectedBlockName,
	showNoBlockSelectedMessage = true,
} ) => {
	if ( count > 1 ) {
		return <MultiSelectionInspector />;
	}

	const isSelectedBlockUnregistered = selectedBlockName === getUnregisteredTypeHandlerName();

	/*
	 * If the selected block is of an unregistered type, avoid showing it as an actual selection
	 * because we want the user to focus on the unregistered block warning, not block settings.
	 */
	if ( ! blockType || ! selectedBlockClientId || isSelectedBlockUnregistered ) {
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
		<div className="block-editor-block-inspector">
			<BlockCard blockType={ blockType } />
			{ hasBlockStyles && (
				<div>
					<PanelBody
						title={ __( 'Styles' ) }
						initialOpen={ false }
					>
						<BlockStyles
							clientId={ selectedBlockClientId }
						/>
						<DefaultStylePicker blockName={ blockType.name } />
					</PanelBody>
				</div>
			) }
			<InspectorControls.Slot bubblesVirtually />
			<div>
				<__experimentalSlotFillConsumer>
					{ ( { hasFills } ) =>
						hasFills( InspectorAdvancedControls.slotName ) && (
							<PanelBody
								className="block-editor-block-inspector__advanced"
								title={ __( 'Advanced' ) }
								initialOpen={ false }
							>
								<InspectorAdvancedControls.Slot bubblesVirtually />
							</PanelBody>
						)
					}
				</__experimentalSlotFillConsumer>
			</div>
			<SkipToSelectedBlock key="back" />
		</div>
	);
};

export default withSelect(
	( select ) => {
		const { getSelectedBlockClientId, getSelectedBlockCount, getBlockName } = select( 'core/block-editor' );
		const { getBlockStyles } = select( 'core/blocks' );
		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockName = selectedBlockClientId && getBlockName( selectedBlockClientId );
		const blockType = selectedBlockClientId && getBlockType( selectedBlockName );
		const blockStyles = selectedBlockClientId && getBlockStyles( selectedBlockName );
		return {
			count: getSelectedBlockCount(),
			hasBlockStyles: blockStyles && blockStyles.length > 0,
			selectedBlockName,
			selectedBlockClientId,
			blockType,
		};
	}
)( BlockInspector );
