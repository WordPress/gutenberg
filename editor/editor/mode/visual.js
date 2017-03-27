/**
 * Internal dependencies
 */
import InserterButton from '../../inserter/button';

function Blocks( { blocks, onChange } ) {
	const onChangeBlock = ( index ) => ( changes ) => {
		const newBlock = {
			...blocks[ index ],
			changes
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
				{ blocks.map( ( block, index ) => {
					const settings = wp.blocks.getBlockSettings( block.blockType );

					return (
						<settings.edit
							key={ index }
							attributes={ block.attributes }
							onChange={ onChangeBlock( index ) } />
					);
				} ) }
			</div>
			<InserterButton />
		</div>
	);
}

export default Blocks;
