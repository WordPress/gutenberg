/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SearchControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InserterSearchResults from './search-results';
import useInsertionPoint from './hooks/use-insertion-point';
import usePatternsState from './hooks/use-patterns-state';
import useBlockTypesState from './hooks/use-block-types-state';
import { store as blockEditorStore } from '../../store';

const SEARCH_THRESHOLD = 6;
const SHOWN_BLOCK_TYPES = 6;
const SHOWN_BLOCK_PATTERNS = 2;
const SHOWN_BLOCK_PATTERNS_WITH_PRIORITIZATION = 4;

export default function ModalInserter(
	{ onSelect, rootClientId, clientId, isAppender, prioritizePatterns },
	ref
) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ destinationRootClientId, onInsertBlocks ] = useInsertionPoint( {
		onSelect,
		rootClientId,
		clientId,
		isAppender,
	} );
	const [ blockTypes ] = useBlockTypesState(
		destinationRootClientId,
		onInsertBlocks
	);

	const [ patterns ] = usePatternsState(
		onInsertBlocks,
		destinationRootClientId
	);

	const { setInserterIsOpened } = useSelect(
		( select ) => {
			const { getSettings, getBlockIndex, getBlockCount } =
				select( blockEditorStore );
			const settings = getSettings();
			const index = getBlockIndex( clientId );
			const blockCount = getBlockCount();

			return {
				setInserterIsOpened: settings.__experimentalSetIsInserterOpened,
				insertionIndex: index === -1 ? blockCount : index,
			};
		},
		[ clientId ]
	);

	const showPatterns =
		patterns.length && ( !! filterValue || prioritizePatterns );
	const showSearch =
		( showPatterns && patterns.length > SEARCH_THRESHOLD ) ||
		blockTypes.length > SEARCH_THRESHOLD;

	let maxBlockPatterns = 0;
	if ( showPatterns ) {
		maxBlockPatterns = prioritizePatterns
			? SHOWN_BLOCK_PATTERNS_WITH_PRIORITIZATION
			: SHOWN_BLOCK_PATTERNS;
	}

	return (
		<div
			className={ classnames( 'block-editor-inserter__quick-inserter', {
				'has-search': showSearch,
				'has-expand': setInserterIsOpened,
			} ) }
		>
			{ showSearch && (
				<SearchControl
					ref={ ref }
					className="block-editor-inserter__search"
					value={ filterValue }
					onChange={ ( value ) => {
						setFilterValue( value );
					} }
					label={ __( 'Search for blocks and patterns' ) }
					placeholder={ __( 'Search' ) }
				/>
			) }

			<div className="block-editor-inserter__quick-inserter-results">
				<InserterSearchResults
					filterValue={ filterValue }
					onSelect={ onSelect }
					rootClientId={ rootClientId }
					clientId={ clientId }
					isAppender={ isAppender }
					maxBlockPatterns={ maxBlockPatterns }
					maxBlockTypes={ SHOWN_BLOCK_TYPES }
					isDraggable={ false }
					prioritizePatterns={ prioritizePatterns }
				/>
			</div>
		</div>
	);
}
