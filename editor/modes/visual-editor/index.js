/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './style.scss';
import Inserter from '../../inserter';
import VisualEditorBlock from './block';
import PostTitle from '../../post-title';

function VisualEditor( { blocks } ) {
	return (
		<div className="editor-visual-editor">
			<PostTitle />
			{ blocks.map( ( uid ) => (
				<VisualEditorBlock key={ uid } uid={ uid } />
			) ) }
			<Inserter />
		</div>
	);
}

export default connect( ( state ) => ( {
	blocks: state.editor.blockOrder
} ) )( VisualEditor );
