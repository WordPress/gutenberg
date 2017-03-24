/**
 * Internal dependencies
 */
import InserterButton from '../inserter/button';

const el = wp.element.createElement;

const Editor = ( { state: { blocks, inserter }, toggleInserter } ) => {
	return el( 'div', null,
		el( 'div', { contentEditable: true },
			wp.blocks.createBlockElement( blocks[ 1 ] )
		),
		el( InserterButton, { onClick: toggleInserter, opened: inserter.opened } )
	);
};

export default Editor;
