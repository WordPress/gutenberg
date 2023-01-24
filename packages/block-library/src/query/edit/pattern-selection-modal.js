/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { Modal, SearchControl } from '@wordpress/components';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	useBlockNameForPatterns,
	getTransformedBlocksFromPattern,
	usePatterns,
} from '../utils';

export default function PatternSelectionModal( {
	clientId,
	attributes,
	setIsPatternSelectionModalOpen,
} ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );
	const onBlockPatternSelect = ( blocks ) => {
		const { newBlocks, queryClientIds } = getTransformedBlocksFromPattern(
			blocks,
			attributes
		);
		replaceBlock( clientId, newBlocks );
		if ( queryClientIds[ 0 ] ) {
			selectBlock( queryClientIds[ 0 ] );
		}
	};
	const blockNameForPatterns = useBlockNameForPatterns(
		clientId,
		attributes
	);
	const blockPatterns = usePatterns( clientId, blockNameForPatterns );

	return (
		<Modal
			overlayClassName="block-library-query-pattern__selection-modal"
			title={ __( 'Choose a pattern' ) }
			onRequestClose={ () => setIsPatternSelectionModalOpen( false ) }
		>
			<div className="block-library-query-pattern__selection-content">
				<div className="block-library-query-pattern__selection-search">
					<SearchControl
						__nextHasNoMarginBottom
						onChange={ setSearchValue }
						value={ searchValue }
						label={ __( 'Search for patterns' ) }
						placeholder={ __( 'Search' ) }
					/>
				</div>
				<BlockPatternsList
					blockPatterns={ blockPatterns }
					shownPatterns={ blockPatterns }
					onClickPattern={ onBlockPatternSelect }
				/>
			</div>
		</Modal>
	);
}
