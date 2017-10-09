/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Slot } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Panel, PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockInspectorAdvancedControls from './advanced-controls';
import { getSelectedBlock, getSelectedBlockCount } from '../../selectors';

const BlockInspector = ( { selectedBlock, count } ) => {
	if ( count > 1 ) {
		return <span className="editor-block-inspector__multi-blocks">{ __( 'Coming Soon' ) }</span>;
	}

	if ( ! selectedBlock ) {
		return <span className="editor-block-inspector__no-blocks">{ __( 'No block selected.' ) }</span>;
	}

	return (
		<Panel>
			<PanelBody className="editor-block-inspector__content">
				<Slot name="Inspector.Controls" />
				<BlockInspectorAdvancedControls />
			</PanelBody>
		</Panel>
	);
};

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
			count: getSelectedBlockCount( state ),
		};
	}
)( BlockInspector );
