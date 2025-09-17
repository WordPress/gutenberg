/**
 * External dependencies
 */
import clsx from 'clsx';

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
import useBlockTypesState from './hooks/use-block-types-state';
import { store as blockEditorStore } from '../../store';

const SEARCH_THRESHOLD = 6;
const SHOWN_BLOCK_TYPES = 6;
const SHOWN_BLOCK_PATTERNS = 2;

export default function QuickInserter( {
	onSelect,
	rootClientId,
	clientId,
	isAppender,
	selectBlockOnInsert,
	hasSearch = true,
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
		onInsertBlocks,
		true
	);

	const { setInserterIsOpened, insertionIndex } = useSelect(
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

	const showSearch = hasSearch && blockTypes.length > SEARCH_THRESHOLD;

	useEffect( () => {
		if ( setInserterIsOpened ) {
			setInserterIsOpened( false );
		}
	}, [ setInserterIsOpened ] );

	// When clicking Browse All select the appropriate block so as
	// the insertion point can work as expected.
	const onBrowseAll = () => {
		setInserterIsOpened( {
			filterValue,
			onSelect,
			rootClientId,
			insertionIndex,
		} );
	};

	return (
		<div
			className={ clsx( 'block-editor-inserter__quick-inserter', {
				'has-search': showSearch,
				'has-expand': setInserterIsOpened,
			} ) }
		>
			{ showSearch && (
				<SearchControl
					__nextHasNoMarginBottom
					className="block-editor-inserter__search"
					value={ filterValue }
					onChange={ ( value ) => {
						setFilterValue( value );
					} }
					label={ __( 'Search' ) }
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
					maxBlockPatterns={
						!! filterValue ? SHOWN_BLOCK_PATTERNS : 0
					}
					maxBlockTypes={ SHOWN_BLOCK_TYPES }
					isDraggable={ false }
					selectBlockOnInsert={ selectBlockOnInsert }
					isQuick
				/>
			</div>

			{ setInserterIsOpened && (
				<Button
					__next40pxDefaultSize
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
