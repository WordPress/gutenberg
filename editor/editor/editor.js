/**
 * Internal dependencies
 */
import InserterButton from '../inserter/button';

const Editor = ( { state: { blocks, inserter }, toggleInserter } ) => {
	return (
		<div>
			<div contentEditable>
				{ blocks.map( ( block, index ) =>
					<div key={ index }>
						{ wp.blocks.getBlockSettings( block.blockType ).edit( block.attributes ) }
					</div>
				) }
			</div>
			<InserterButton onClick={ toggleInserter } opened={ inserter.opened } />
		</div>
	);
};

export default Editor;
