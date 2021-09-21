/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PatternExplorerSidebar from './sidebar';
import PatternExplorerPreview from './preview';
import useInsertionPoint from '../inserter/hooks/use-insertion-point';

function PatternExplorer( { rootClientId, __experimentalInsertionIndex } ) {
	const [ selectedPattern, setSelectedPattern ] = useState();
	const [
		destinationRootClientId,
		onInsertBlocks,
		,
		destinationIndex,
	] = useInsertionPoint( {
		rootClientId,
		insertionIndex: __experimentalInsertionIndex,
	} );
	return (
		<div className="block-editor-pattern-explorer">
			<PatternExplorerSidebar
				rootClientId={ destinationRootClientId }
				setSelectedPattern={ setSelectedPattern }
			/>
			{ selectedPattern && (
				<PatternExplorerPreview
					rootClientId={ destinationRootClientId }
					destinationIndex={ destinationIndex }
					selectedPattern={ selectedPattern }
					onInsertBlocks={ onInsertBlocks }
				/>
			) }
		</div>
	);
}

export default PatternExplorer;
