/**
 * External dependencies
 */
import { cloneDeep } from 'lodash';

/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import PreviewSettings from './preview-settings';
import BlockPreview from '../../block-preview';
import { store as blockEditorStore } from '../../../store';

const INITIAL_WIDTH = 660;
const MIN_PREVIEW_WIDTH = 280;
const enableHandlers = {
	left: true,
	right: true,
	top: false,
	bottom: false,
};

// TODO: refactor, doc, tests (mutation)
const getPreviewBlocksInRootBlock = (
	block,
	patternBlocks,
	destinationRootClientId,
	destinationIndex
) => {
	const { clientId } = block;
	if ( clientId === destinationRootClientId ) {
		block.innerBlocks = [
			...block.innerBlocks.slice( 0, destinationIndex ),
			...patternBlocks,
			...block.innerBlocks.slice( destinationIndex ),
		];
		return block;
	}
	return {
		...block,
		innerBlocks: block.innerBlocks.map( ( innerBlock ) =>
			getPreviewBlocksInRootBlock(
				innerBlock,
				patternBlocks,
				destinationRootClientId,
				destinationIndex
			)
		),
	};
};

function PreviewPattern( {
	pattern,
	destinationRootClientId,
	destinationIndex,
} ) {
	// const [ width, setWidth ] = useState(
	// 	window.innerWidth < INITIAL_WIDTH ? window.innerWidth : INITIAL_WIDTH
	// );
	const [ width, setWidth ] = useState( INITIAL_WIDTH );
	const [ showPreviewWithContent, setShowPreviewWithContent ] = useState(
		false
	);
	const { blocks } = pattern;
	const baseCssClass = 'block-editor-pattern-explorer__preview__pattern';
	const rootBlock = useSelect(
		( select ) => {
			const { getBlock, getBlockHierarchyRootClientId } = select(
				blockEditorStore
			);
			return (
				destinationRootClientId &&
				getBlock(
					getBlockHierarchyRootClientId( destinationRootClientId )
				)
			);
		},
		[ destinationRootClientId ]
	);

	const previewBlocks = useMemo( () => {
		if ( ! showPreviewWithContent || ! rootBlock ) {
			return blocks;
		}

		const _rootBlock = cloneDeep( rootBlock );
		return [
			cloneBlock(
				getPreviewBlocksInRootBlock(
					_rootBlock,
					blocks,
					destinationRootClientId,
					destinationIndex
				)
			),
		];
	}, [
		blocks,
		rootBlock,
		destinationRootClientId,
		destinationIndex,
		showPreviewWithContent,
	] );

	return (
		<div className={ baseCssClass }>
			<PreviewSettings
				width={ width }
				setWidth={ setWidth }
				showPreviewWithContentControl={ !! destinationRootClientId }
				showPreviewWithContent={ showPreviewWithContent }
				setShowPreviewWithContent={ setShowPreviewWithContent }
			/>
			<ResizableBox
				size={ {
					width: width ?? 'auto',
					height: 'auto',
				} }
				minWidth={ MIN_PREVIEW_WIDTH }
				// maxWidth={ maxWidthBuffer }
				// minHeight={ minHeight }
				// maxHeight="50vh"
				enable={ enableHandlers }
				onResize={ ( _event, _direction, elt ) => {
					setWidth( parseInt( elt.offsetWidth, 10 ) );
				} }
				// onResizeStop={ ( _event, _direction, elt ) => {
				// 	setWidth( parseInt( elt.offsetWidth, 10 ) );
				// } }
			>
				<BlockPreview
					blocks={ previewBlocks }
					viewportWidth={ width }
				/>
			</ResizableBox>
		</div>
	);
}

export default PreviewPattern;
