/**
 * Internal dependencies
 */
import PreviewHeader from './preview-header';
import PreviewPattern from './preview-pattern';

function PatternExplorerPreview( {
	rootClientId,
	destinationIndex,
	selectedPattern = {},
	onInsertBlocks,
} ) {
	const baseCssClass = 'block-editor-pattern-explorer__preview';
	return (
		<div className={ baseCssClass }>
			<PreviewHeader
				pattern={ selectedPattern }
				onInsertBlocks={ onInsertBlocks }
			/>
			<PreviewPattern
				pattern={ selectedPattern }
				destinationRootClientId={ rootClientId }
				destinationIndex={ destinationIndex }
			/>
		</div>
	);
}

export default PatternExplorerPreview;
