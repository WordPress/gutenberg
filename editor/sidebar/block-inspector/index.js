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
import BlockInspectorClassName from './class-name';
import { getSelectedBlock } from '../../selectors';

const BlockInspector = ( { selectedBlock } ) => {
	if ( ! selectedBlock ) {
		return <span className="editor-block-inspector__no-blocks">{ __( 'No block selected.' ) }</span>;
	}

	return (
		<Panel>
			<PanelBody>
				<Slot name="Inspector.Controls" />
				<BlockInspectorClassName />
			</PanelBody>
		</Panel>
	);
};

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
		};
	}
)( BlockInspector );
