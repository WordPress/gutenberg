/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InserterSearchForm from './search-form';
import InserterSearchResults from './search-results';
import useInsertionPoint from './hooks/use-insertion-point';
import usePatternsState from './hooks/use-patterns-state';
import useBlockTypesState from './hooks/use-block-types-state';

const SEARCH_THRESHOLD = 6;
const SHOWN_BLOCK_TYPES = 6;
const SHOWN_BLOCK_PATTERNS = 2;

export default function QuickInserter( {
	onSelect,
	rootClientId,
	clientId,
	isAppender,
	selectBlockOnInsert,
} ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ destinationRootClientId, onInsertBlocks ] = useInsertionPoint( {
		onSelect,
		rootClientId,
		clientId,
		isAppender,
		selectBlockOnInsert,
	} );
	const [ blockTypes ] = useBlockTypesState(
		destinationRootClientId,
		onInsertBlocks
	);

	const [ patterns ] = usePatternsState(
		onInsertBlocks,
		destinationRootClientId
	);
	const showPatterns = patterns.length && !! filterValue;
	const showSearch =
		( showPatterns && patterns.length > SEARCH_THRESHOLD ) ||
		blockTypes.length > SEARCH_THRESHOLD;

	const { setInserterIsOpened, blockIndex } = useSelect(
		( select ) => {
			const { getSettings, getBlockIndex } = select(
				'core/block-editor'
			);
			return {
				setInserterIsOpened: getSettings()
					.__experimentalSetIsInserterOpened,
				blockIndex: getBlockIndex( clientId, rootClientId ),
			};
		},
		[ clientId, rootClientId ]
	);

	useEffect( () => {
		if ( setInserterIsOpened ) {
			setInserterIsOpened( false );
		}
	}, [ setInserterIsOpened ] );

	const { __unstableSetInsertionPoint } = useDispatch( 'core/block-editor' );

	// When clicking Browse All select the appropriate block so as
	// the insertion point can work as expected
	const onBrowseAll = () => {
		__unstableSetInsertionPoint( rootClientId, blockIndex );
		setInserterIsOpened( true );
	};

	return (
		<div
			className={ classnames( 'block-editor-inserter__quick-inserter', {
				'has-search': showSearch,
				'has-expand': setInserterIsOpened,
			} ) }
		>
			{ showSearch && (
				<InserterSearchForm
					value={ filterValue }
					onChange={ ( value ) => {
						setFilterValue( value );
					} }
					placeholder={ __( 'Search for a block' ) }
				/>
			) }

			<div className="block-editor-inserter__quick-inserter-results">
				<InserterSearchResults
					filterValue={ filterValue }
					onSelect={ onSelect }
					rootClientId={ rootClientId }
					clientId={ clientId }
					isAppender={ isAppender }
					selectBlockOnInsert={ selectBlockOnInsert }
					maxBlockPatterns={ showPatterns ? SHOWN_BLOCK_PATTERNS : 0 }
					maxBlockTypes={ SHOWN_BLOCK_TYPES }
					isDraggable={ false }
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
