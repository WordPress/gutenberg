/**
 * External dependencies
 */
import { isEmpty } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BlockIcon,
	getBlockType,
	InspectorControls,
	InspectorAdvancedControls,
} from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getSelectedBlock, getSelectedBlockCount } from '../../store/selectors';

const BlockInspector = ( { selectedBlock, count } ) => {
	if ( count > 1 ) {
		return <span className="editor-block-inspector__multi-blocks">{ __( 'Coming Soon' ) }</span>;
	}

	if ( ! selectedBlock ) {
		return <span className="editor-block-inspector__no-blocks">{ __( 'No block selected.' ) }</span>;
	}

	const blockType = getBlockType( selectedBlock.name );

	return [
		<div className="editor-block-inspector__card" key="card">
			<div className="editor-block-inspector__card-icon">
				<BlockIcon icon={ blockType.icon } />
			</div>
			<div className="editor-block-inspector__card-content">
				<div className="editor-block-inspector__card-title">{ blockType.title }</div>
				<div className="editor-block-inspector__card-description">{ blockType.description }</div>
			</div>
		</div>,
		<InspectorControls.Slot key="inspector-controls" />,
		<InspectorAdvancedControls.Slot key="inspector-advanced-controls">
			{ ( fills ) => ! isEmpty( fills ) && (
				<PanelBody
					className="editor-block-inspector__advanced"
					title={ __( 'Advanced' ) }
				>
					{ fills }
				</PanelBody>
			) }
		</InspectorAdvancedControls.Slot>,
	];
};

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
			count: getSelectedBlockCount( state ),
		};
	}
)( BlockInspector );
