/**
 * Internal dependencies
 */
import InserterButton from '../../inserter/button';

function VisualEditor( { blocks, onChange } ) {
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
		<div className="visual-editor">
			{ blocks.map( ( block, index ) => {
				const settings = wp.blocks.getBlockSettings( block.blockType );

				let BlockEdit;
				if ( settings ) {
					BlockEdit = settings.edit || settings.save;
				}

				if ( ! BlockEdit ) {
					return;
				}

				return (
					<BlockEdit
						key={ index }
						attributes={ block.attributes }
						onChange={ onChangeBlock( index ) } />
				);
			} ) }
			<InserterButton />
		</div>
	);
}

export default VisualEditor;
