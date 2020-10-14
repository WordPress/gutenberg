/**
 * External dependencies
 */
import { orderBy } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { VisuallyHidden, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import BlockPatternsList from '../block-patterns-list';
import InserterSearchForm from './search-form';
import InserterPanel from './panel';
import InserterNoResults from './no-results';
import useInsertionPoint from './hooks/use-insertion-point';
import usePatternsState from './hooks/use-patterns-state';
import useBlockTypesState from './hooks/use-block-types-state';
import { searchBlockItems, searchItems } from './search-items';

const SEARCH_THRESHOLD = 6;
const SHOWN_BLOCK_TYPES = 6;
const SHOWN_BLOCK_PATTERNS = 2;

const preventArrowKeysPropagation = ( event ) => {
	if (
		[ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].includes( event.keyCode )
	) {
		// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
		event.stopPropagation();
	}
};
const stopKeyPropagation = ( event ) => event.stopPropagation();

function QuickInserterList( {
	blockTypes,
	blockPatterns,
	onSelectBlockType,
	onSelectBlockPattern,
	onHover,
} ) {
	const shownBlockTypes = useMemo(
		() =>
			orderBy( blockTypes, [ 'frecency' ], [ 'desc' ] ).slice(
				0,
				SHOWN_BLOCK_TYPES
			),
		[ blockTypes ]
	);
	const shownBlockPatterns = useMemo(
		() => blockPatterns.slice( 0, SHOWN_BLOCK_PATTERNS ),
		[ blockTypes ]
	);
	return (
		<div className="block-editor-inserter__quick-inserter-results">
			{ ! shownBlockTypes.length && ! shownBlockPatterns.length && (
				<InserterNoResults />
			) }

			{ !! shownBlockTypes.length && (
				<InserterPanel
					title={
						<VisuallyHidden>{ __( 'Blocks' ) }</VisuallyHidden>
					}
				>
					<BlockTypesList
						items={ shownBlockTypes }
						onSelect={ onSelectBlockType }
						onHover={ onHover }
						label={ __( 'Blocks' ) }
					/>
				</InserterPanel>
			) }

			{ !! shownBlockTypes.length && !! shownBlockPatterns.length && (
				<div className="block-editor-inserter__quick-inserter-separator" />
			) }

			{ !! shownBlockPatterns.length && (
				<InserterPanel
					title={
						<VisuallyHidden>{ __( 'Blocks' ) }</VisuallyHidden>
					}
				>
					<div className="block-editor-inserter__quick-inserter-patterns">
						<BlockPatternsList
							shownPatterns={ shownBlockPatterns }
							blockPatterns={ shownBlockPatterns }
							onClickPattern={ onSelectBlockPattern }
						/>
					</div>
				</InserterPanel>
			) }
		</div>
	);
}

export default function QuickInserter( {
	onSelect,
	rootClientId,
	clientId,
	isAppender,
	selectBlockOnInsert,
} ) {
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ filterValue, setFilterValue ] = useState( '' );
	const [
		destinationRootClientId,
		onInsertBlocks,
		onToggleInsertionPoint,
	] = useInsertionPoint( {
		onSelect,
		rootClientId,
		clientId,
		isAppender,
		selectBlockOnInsert,
	} );
	const [
		blockTypes,
		blockTypeCategories,
		blockTypeCollections,
		onSelectBlockType,
	] = useBlockTypesState( destinationRootClientId, onInsertBlocks );
	const [ patterns, , onSelectBlockPattern ] = usePatternsState(
		onInsertBlocks
	);
	const showPatterns =
		! destinationRootClientId && patterns.length && !! filterValue;
	const showSearch =
		( showPatterns && patterns.length > SEARCH_THRESHOLD ) ||
		blockTypes.length > SEARCH_THRESHOLD;

	const filteredBlockTypes = useMemo( () => {
		return searchBlockItems(
			blockTypes,
			blockTypeCategories,
			blockTypeCollections,
			filterValue
		);
	}, [ filterValue, blockTypes, blockTypeCategories, blockTypeCollections ] );

	const filteredBlockPatterns = useMemo(
		() => searchItems( patterns, filterValue ),
		[ filterValue, patterns ]
	);

	const setInserterIsOpened = useSelect(
		( select ) =>
			select( 'core/block-editor' ).getSettings()
				.__experimentalSetIsInserterOpened,
		[]
	);

	const previousBlockClientId = useSelect(
		( select ) =>
			select( 'core/block-editor' ).getPreviousBlockClientId( clientId ),
		[ clientId ]
	);

	useEffect( () => {
		if ( setInserterIsOpened ) {
			setInserterIsOpened( false );
		}
	}, [ setInserterIsOpened ] );

	const { selectBlock } = useDispatch( 'core/block-editor' );

	// Announce search results on change
	useEffect( () => {
		if ( ! filterValue ) {
			return;
		}
		const count = filteredBlockTypes.length + filteredBlockPatterns.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filterValue, debouncedSpeak ] );

	// When clicking Browse All select the appropriate block so as
	// the insertion point can work as expected
	const onBrowseAll = () => {
		// We have to select the previous block because the menu inserter
		// inserts the new block after the selected one.
		// Ideally, this selection shouldn't focus the block to avoid the setTimeout.
		selectBlock( previousBlockClientId );
		// eslint-disable-next-line @wordpress/react-no-unsafe-timeout
		setTimeout( () => {
			setInserterIsOpened( true );
		} );
	};

	// Disable reason (no-autofocus): The inserter menu is a modal display, not one which
	// is always visible, and one which already incurs this behavior of autoFocus via
	// Popover's focusOnMount.
	// Disable reason (no-static-element-interactions): Navigational key-presses within
	// the menu are prevented from triggering WritingFlow and ObserveTyping interactions.
	/* eslint-disable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions */
	return (
		<div
			className={ classnames( 'block-editor-inserter__quick-inserter', {
				'has-search': showSearch,
				'has-expand': setInserterIsOpened,
			} ) }
			onKeyPress={ stopKeyPropagation }
			onKeyDown={ preventArrowKeysPropagation }
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

			<QuickInserterList
				blockTypes={ filteredBlockTypes }
				blockPatterns={ showPatterns ? filteredBlockPatterns : [] }
				onSelectBlockPattern={ onSelectBlockPattern }
				onSelectBlockType={ onSelectBlockType }
				onHover={ onToggleInsertionPoint }
			/>

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
	/* eslint-enable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions */
}
