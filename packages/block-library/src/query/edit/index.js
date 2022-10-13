/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import {
	BlockContextProvider,
	store as blockEditorStore,
	__experimentalBlockPatternSetup as BlockPatternSetup,
} from '@wordpress/block-editor';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import QueryContent from './query-content';
import QueryPlaceholder from './query-placeholder';
import {
	useBlockNameForPatterns,
	getTransformedBlocksFromPattern,
} from '../utils';

const QueryEdit = ( props ) => {
	const { clientId, attributes } = props;
	const [ isPatternSelectionModalOpen, setIsPatternSelectionModalOpen ] =
		useState( false );
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlocks( clientId ).length,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? QueryContent : QueryPlaceholder;
	return (
		<>
			<Component
				{ ...props }
				openPatternSelectionModal={ () =>
					setIsPatternSelectionModalOpen( true )
				}
			/>
			{ isPatternSelectionModalOpen && (
				<PatternSelectionModal
					clientId={ clientId }
					attributes={ attributes }
					setIsPatternSelectionModalOpen={
						setIsPatternSelectionModalOpen
					}
				/>
			) }
		</>
	);
};

function PatternSelectionModal( {
	clientId,
	attributes,
	setIsPatternSelectionModalOpen,
} ) {
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
	// When we preview Query Loop blocks we should prefer the current
	// block's postType, which is passed through block context.
	const blockPreviewContext = useMemo(
		() => ( {
			previewPostType: attributes.query.postType,
		} ),
		[ attributes.query.postType ]
	);
	const blockNameForPatterns = useBlockNameForPatterns(
		clientId,
		attributes
	);
	return (
		<Modal
			className="block-editor-query-pattern__selection-modal"
			title={ __( 'Choose a pattern' ) }
			closeLabel={ __( 'Cancel' ) }
			onRequestClose={ () => setIsPatternSelectionModalOpen( false ) }
		>
			<BlockContextProvider value={ blockPreviewContext }>
				<BlockPatternSetup
					blockName={ blockNameForPatterns }
					clientId={ clientId }
					onBlockPatternSelect={ onBlockPatternSelect }
				/>
			</BlockContextProvider>
		</Modal>
	);
}

export default QueryEdit;
