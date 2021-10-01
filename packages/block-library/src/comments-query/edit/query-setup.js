/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';
import {
	useBlockProps,
	store as blockEditorStore,
	__experimentalBlockPatternSetup as BlockPatternSetup,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getFirstQueryClientIdFromBlocks } from '../utils';

const QueryPlaceholder = () => {
	const blockProps = useBlockProps();

	// XXX: Here will be a proper placeholder
	return (
		<div { ...blockProps }> QueryPlacholder: Actually implement this </div>
	);
};

export const QueryPatternSetup = ( props ) => {
	const { clientId, name: blockName } = props;
	const blockProps = useBlockProps();
	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );
	const onBlockPatternSelect = ( blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );

		// XXX: Not yet sure yet if I want to re-use this mechanism from the core/query block
		const firstQueryClientId = getFirstQueryClientIdFromBlocks(
			clonedBlocks
		);

		replaceBlock( clientId, clonedBlocks );
		if ( firstQueryClientId ) {
			selectBlock( firstQueryClientId );
		}
	};

	// `startBlankComponent` is what to render when clicking `Start blank`
	// or if no matched patterns are found.
	return (
		<div { ...blockProps }>
			<BlockPatternSetup
				blockName={ blockName }
				clientId={ clientId }
				startBlankComponent={ <QueryPlaceholder { ...props } /> }
				onBlockPatternSelect={ onBlockPatternSelect }
			/>
		</div>
	);
};
