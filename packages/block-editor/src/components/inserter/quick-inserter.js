/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, SearchControl } from '@wordpress/components';
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

export default function QuickInserter( {
	onSelect,
	rootClientId,
	clientId,
	isAppender,
} ) {
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

	const {
		setInserterIsOpened,
		insertionIndex,
		prioritizePatterns,
	} = useSelect(
		( select ) => {
			const { getSettings, getBlockIndex, getBlockCount } = select(
				blockEditorStore
			);
			const settings = getSettings();
			const index = getBlockIndex( clientId );
			const blockCount = getBlockCount();

			return {
				setInserterIsOpened: settings.__experimentalSetIsInserterOpened,
				prioritizePatterns:
					settings.__experimentalPrioritizePatternsOnQuickInserterRoot &&
					! rootClientId &&
					index > 0 &&
					index < blockCount,
				insertionIndex: index === -1 ? blockCount : index,
			};
		},
		[ clientId, rootClientId ]
	);

	const showPatterns =
		patterns.length && ( !! filterValue || prioritizePatterns );
	const showSearch =
		( showPatterns && patterns.length > SEARCH_THRESHOLD ) ||
		blockTypes.length > SEARCH_THRESHOLD;

	useEffect( () => {
		if ( setInserterIsOpened ) {
			setInserterIsOpened( false );
		}
	}, [ setInserterIsOpened ] );

	// When clicking Browse All select the appropriate block so as
	// the insertion point can work as expected
	const onBrowseAll = () => {
		setInserterIsOpened( { rootClientId, insertionIndex, filterValue } );
	};

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
					__experimentalPrioritizePatterns={ prioritizePatterns }
				/>
			</div>

			{ setInserterIsOpened && (
				<Button
					className="block-editor-inserter__quick-inserter-expand"
					onClick={ onBrowseAll }
					aria-label={ __(
						'Browse all. This will open the main inserter panel in the editor toolbar.'
					) }
				>
					{ __( 'Browse all' ) }
				</Button>
			) }
		</div>
	);
}
