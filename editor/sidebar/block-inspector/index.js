/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Slot } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Panel, PanelHeader, PanelBody } from 'components';
import { getBlockType } from 'blocks';

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

	const blockType = getBlockType( selectedBlock.name );

	const onDeselect = ( event ) => {
		event.preventDefault();
		props.deselectBlock( selectedBlock.uid );
	};

	const header = (
		<strong>
			<a href="" onClick={ onDeselect } className="editor-block-inspector__deselect-post">
				{ __( 'Post Settings' ) }
			</a>
			{ ' → ' }
			{ blockType.title }
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
