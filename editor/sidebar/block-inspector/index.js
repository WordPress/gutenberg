/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Slot } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Panel, PanelBody } from 'components';
import { getBlockType } from 'blocks';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockInspectorClassName from './class-name';
import { getSelectedBlock } from '../../selectors';

const BlockInspector = ( { selectedBlock } ) => {
	let blockType;
	if ( ! selectedBlock || ! ( blockType = getBlockType( selectedBlock.name ) ) ) {
		return <span className="editor-block-inspector__no-blocks">{ __( 'No block selected.' ) }</span>;
	}

	const { description } = blockType;

	return (
		<Panel>
			<PanelBody>
				{ description && (
					<p className="editor-block-inspector__description">
						{ description }
					</p>
				) }
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
