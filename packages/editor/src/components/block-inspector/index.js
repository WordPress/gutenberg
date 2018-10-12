/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockIcon from '../block-icon';
import InspectorControls from '../inspector-controls';
import InspectorAdvancedControls from '../inspector-advanced-controls';
import BlockStyles from '../block-styles';

const BlockInspector = ( { selectedBlock, blockType, count } ) => {
	if ( count > 1 ) {
		return <span className="editor-block-inspector__multi-blocks">{ __( 'Coming Soon' ) }</span>;
	}

	if ( ! selectedBlock ) {
		return <span className="editor-block-inspector__no-blocks">{ __( 'No block selected.' ) }</span>;
	}

	return (
		<Fragment>
			<div className="editor-block-inspector__card">
				<BlockIcon icon={ blockType.icon } showColors />
				<div className="editor-block-inspector__card-content">
					<div className="editor-block-inspector__card-title">{ blockType.title }</div>
					<div className="editor-block-inspector__card-description">{ blockType.description }</div>
				</div>
			</div>
			<div><InspectorControls.Slot /></div>
			{ !! blockType.styles && (
				<div className="editor-block-inspector__styles">
					<PanelBody
						title={ __( 'Styles' ) }
						initialOpen={ false }
					>
						<BlockStyles
							clientId={ selectedBlock.clientId }
						/>
					</PanelBody>
				</div>
			) }
			<div>
				<InspectorAdvancedControls.Slot>
					{ ( fills ) => ! isEmpty( fills ) && (
						<PanelBody
							className="editor-block-inspector__advanced"
							title={ __( 'Advanced' ) }
							initialOpen={ false }
						>
							{ fills }
						</PanelBody>
					) }
				</InspectorAdvancedControls.Slot>
			</div>
			<SkipToSelectedBlock key="back" />
		</Fragment>
	);
};

export default withSelect(
	( select ) => {
		const { getSelectedBlock, getSelectedBlockCount } = select( 'core/editor' );
		const selectedBlock = getSelectedBlock();
		const blockType = selectedBlock && getBlockType( selectedBlock.name );
		return {
			selectedBlock,
			blockType,
			count: getSelectedBlockCount(),
		};
	}
)( BlockInspector );
