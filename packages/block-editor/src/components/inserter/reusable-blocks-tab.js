/**
 * WordPress dependencies
 */
import { withSpokenMessages } from '@wordpress/components';
import { useMemo, useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import { searchBlockItems } from './search-items';
import InserterPanel from './panel';
import InserterNoResults from './no-results';
import useBlockTypesState from './hooks/use-block-types-state';

function ReusableBlocksSearchResults( {
	debouncedSpeak,
	filterValue,
	onHover,
	onInsert,
	rootClientId,
} ) {
	const [ items, categories, collections, onSelectItem ] = useBlockTypesState(
		rootClientId,
		onInsert
	);

	const filteredItems = useMemo( () => {
		return searchBlockItems(
			items,
			categories,
			collections,
			filterValue
		).filter( ( { category } ) => category === 'reusable' );
	}, [ filterValue, items, categories, collections ] );

	// Announce search results on change.
	useEffect( () => {
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', filteredItems.length ),
			filteredItems.length
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filterValue, debouncedSpeak ] );

	if ( filterValue ) {
		return !! filteredItems.length ? (
			<InserterPanel title={ __( 'Search Results' ) }>
				<BlockTypesList
					items={ filteredItems }
					onSelect={ onSelectItem }
					onHover={ onHover }
				/>
			</InserterPanel>
		) : (
			<InserterNoResults />
		);
	}
}

export function InsertableReusableBlocks( {
	onInsert,
	onHover,
	rootClientId,
} ) {
	const [ items, , , onSelectItem ] = useBlockTypesState(
		rootClientId,
		onInsert
	);

	const filteredItems = useMemo( () => {
		return items.filter( ( { category } ) => category === 'reusable' );
	}, [ items ] );

	return (
		<>
			{ filteredItems.length > 0 && (
				<InserterPanel title={ __( 'Reusable blocks' ) }>
					<BlockTypesList
						items={ filteredItems }
						onSelect={ onSelectItem }
						onHover={ onHover }
					/>
				</InserterPanel>
			) }
		</>
	);
}

// The unwrapped component is only exported for use by unit tests.
/**
 * List of reusable blocks shown in the "Reusable" tab of the inserter.
 *
 * @param {Object}   props                Component props.
 * @param {?string}  props.rootClientId   Client id of block to insert into.
 * @param {Function} props.onInsert       Callback to run when item is inserted.
 * @param {Function} props.onHover        Callback to run when item is hovered.
 * @param {?string}  props.filterValue    Search term.
 * @param {Function} props.debouncedSpeak Debounced speak function.
 *
 * @return {WPComponent} The component.
 */
export function ReusableBlocksTab( {
	rootClientId,
	onInsert,
	onHover,
	filterValue,
	debouncedSpeak,
} ) {
	return (
		<>
			{ filterValue ? (
				<ReusableBlocksSearchResults
					debouncedSpeak={ debouncedSpeak }
					filterValue={ filterValue }
					onHover={ onHover }
					onInsert={ onInsert }
					rootClientId={ rootClientId }
				/>
			) : (
				<InsertableReusableBlocks
					onInsert={ onInsert }
					onHover={ onHover }
					rootClientId={ rootClientId }
				/>
			) }
			<div className="block-editor-inserter__manage-reusable-blocks-container">
				<a
					className="block-editor-inserter__manage-reusable-blocks"
					href={ addQueryArgs( 'edit.php', {
						post_type: 'wp_block',
					} ) }
				>
					{ __( 'Manage all reusable blocks' ) }
				</a>
			</div>
		</>
	);
}

export default withSpokenMessages( ReusableBlocksTab );
