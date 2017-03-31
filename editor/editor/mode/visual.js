/**
 * External dependencies
 */
import { findIndex } from 'lodash';

/**
 * Internal dependencies
 */
import InserterButton from '../../inserter/button';

function Blocks( { blocks, onChange } ) {
	const onChangeBlock = ( uid ) => ( changes ) => {
		const index = findIndex( blocks, { uid } );
		const newBlock = {
			...blocks[ index ],
			attributes: {
				...blocks[ index ].attributes,
				...changes
			}
		};

		onChange( [
			...blocks.slice( 0, index ),
			newBlock,
			...blocks.slice( index + 1 )
		] );
	};

	return (
		<div className="editor-mode-visual">
			<div>
				{ blocks.map( ( block ) =>
					<div key={ block.uid }>
						{ wp.blocks.getBlockSettings( block.blockType ).edit( block.attributes, onChangeBlock( block.uid ) ) }
					</div>
				) }
			</div>
			<InserterButton />
		</div>
	);
}

export default Blocks;
