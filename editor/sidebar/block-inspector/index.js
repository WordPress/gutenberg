/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import Panel from 'components/panel';
import PanelHeader from 'components/panel/header';
import PanelBody from 'components/panel/body';

/**
 * Internal Dependencies
 */
import { getSelectedBlock } from '../../selectors';

const BlockInspector = ( { selectedBlock } ) => {
	if ( ! selectedBlock ) {
		return null;
	}
	const header = (
		<strong>
			<span className="editor-sidebar__select-post">Post</span> → Block
		</strong>
	);

	return (
		<Panel>
			<PanelHeader label={ header } />
			<PanelBody>
				<div>{ selectedBlock.blockType } settings...</div>
				<ul>
					{ Object.keys( selectedBlock.attributes ).map( ( attribute, index ) => (
						<li key={ index }>{ attribute }: { selectedBlock.attributes[ attribute ] }</li>
					) ) }
				</ul>
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
