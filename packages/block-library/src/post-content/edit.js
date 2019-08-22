/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useMemo, useCallback } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import { serializeBlocks } from '@wordpress/editor';

export default function PostContentEdit() {
	const [ content, setContent ] = useEntityProp( 'post', 'content' );
	const initialBlocks = useMemo( () => parse( content ), [] );
	const [ blocks = initialBlocks, setBlocks ] = useEntityProp( 'post', 'blocks' );
	return (
		<InnerBlocks
			value={ blocks }
			onChange={ setBlocks }
			onInput={ useCallback( () => {
				setContent( ( { blocks: blocksForSerialization = [] } ) =>
					serializeBlocks( blocksForSerialization )
				);
			}, [] ) }
		/>
	);
}
