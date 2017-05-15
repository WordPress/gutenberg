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
import { getBlockUids } from '../../selectors';

function VisualEditor( { blocks } ) {
	return (
		<div className="editor-visual-editor">
			<PostTitle />
			{ blocks.map( ( uid ) => (
				<VisualEditorBlock key={ uid } uid={ uid } />
			) ) }
			<Inserter position="top right" />
		</div>
	);
}

export default connect( ( state ) => ( {
	blocks: getBlockUids( state ),
} ) )( VisualEditor );
