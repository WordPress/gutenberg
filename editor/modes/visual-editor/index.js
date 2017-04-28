/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { map } from 'lodash';

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
			<div className="editor-visual-editor__blocks">
				{ map( blocks, ( block, uid ) => (
					<VisualEditorBlock key={ uid } uid={ uid } />
				) ) }
			</div>
			<Inserter />
		</div>
	);
}

export default connect( ( state ) => ( {
	blocks: state.editor.blocksByUid,
} ) )( VisualEditor );
