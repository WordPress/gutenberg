/**
 * Internal dependencies
 */
import InserterButton from '../inserter/button';

const el = wp.element.createElement;

const Editor = ( { state: { blocks, inserter }, toggleInserter } ) => {
	return el( 'div', null,
		el( 'div', { contentEditable: true },
			blocks.map( ( block, index ) =>
				el( 'div', { key: index },
					wp.blocks.getBlockSettings( block.blockType ).edit( block.attributes )
				)
			)
		),
		el( InserterButton, { onClick: toggleInserter, opened: inserter.opened } )
	);
};

export default Editor;
