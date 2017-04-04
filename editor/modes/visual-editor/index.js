/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import InserterButton from '../../inserter/button';
import VisualEditorBlock from './block';

function VisualEditor( { blocks } ) {
	return (
		<div className="editor-visual-editor">
			{ blocks.map( ( uid ) => (
				<VisualEditorBlock key={ uid } uid={ uid } />
			) ) }
			<InserterButton />
		</div>
	);
}

export default connect( ( state ) => ( {
	blocks: state.blocks.order
} ) )( VisualEditor );
