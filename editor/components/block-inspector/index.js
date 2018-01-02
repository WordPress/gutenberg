/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Slot } from '@wordpress/components';
import { getBlockType, BlockIcon } from '@wordpress/blocks';

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
		<Slot name="Inspector.Controls" key="inspector-controls" />,
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
