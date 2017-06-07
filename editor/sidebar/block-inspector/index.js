/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Slot } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { Panel, PanelHeader, PanelBody } from 'components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { deselectBlock } from '../../actions';
import { getSelectedBlock } from '../../selectors';

const BlockInspector = ( { selectedBlock, ...props } ) => {
	if ( ! selectedBlock ) {
		return null;
	}

	const onDeselect = ( event ) => {
		event.preventDefault();
		props.deselectBlock( selectedBlock.uid );
	};

	const header = (
		<strong>
			<a href="" onClick={ onDeselect } className="editor-block-inspector__deselect-post">Post</a> → Block
		</strong>
	);

	return (
		<Panel>
			<PanelHeader label={ header } />
			<PanelBody>
				<Slot name="Inspector.Controls" />
			</PanelBody>
		</Panel>
	);
};

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
		};
	},
	{ deselectBlock }
)( BlockInspector );
