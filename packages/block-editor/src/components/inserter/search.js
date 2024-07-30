/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useState,
	useCallback,
	useMemo,
	useRef,
	useLayoutEffect,
} from '@wordpress/element';
import { VisuallyHidden, SearchControl, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDebouncedInput } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Tips from './tips';
import InserterPreviewPanel from './preview-panel';
import BlockTypesTab from './block-types-tab';
import BlockPatternsTab from './block-patterns-tab';
import { PatternCategoryPreviews } from './block-patterns-tab/pattern-category-previews';
import { MediaTab, MediaCategoryPanel } from './media-tab';
import InserterSearchResults from './search-results';
import useInsertionPoint from './hooks/use-insertion-point';
import { store as blockEditorStore } from '../../store';
import TabbedSidebar from '../tabbed-sidebar';
import { useZoomOut } from '../../hooks/use-zoom-out';

// TODO - add back useMemo
export const InserterSearch = ( { filterValue, selectedTab } ) => {
	if ( selectedTab === 'media' ) {
		return null;
	}

	return (
		<>
			<SearchControl
				__nextHasNoMarginBottom
				className="block-editor-inserter__search"
				onChange={ ( value ) => {
					if ( hoveredItem ) {
						setHoveredItem( null );
					}
					setFilterValue( value );
				} }
				value={ filterValue }
				label={ __( 'Search for blocks and patterns' ) }
				placeholder={ __( 'Search' ) }
			/>
			{ !! delayedFilterValue && (
				<InserterSearchResults
					filterValue={ delayedFilterValue }
					onSelect={ onSelect }
					onHover={ onHover }
					onHoverPattern={ onHoverPattern }
					rootClientId={ rootClientId }
					clientId={ clientId }
					isAppender={ isAppender }
					__experimentalInsertionIndex={
						__experimentalInsertionIndex
					}
					showBlockDirectory
					shouldFocusBlock={ shouldFocusBlock }
					prioritizePatterns={ selectedTab === 'patterns' }
				/>
			) }
		</>
	);
};
/*[
		selectedTab,
		hoveredItem,
		setHoveredItem,
		setFilterValue,
		filterValue,
		delayedFilterValue,
		onSelect,
		onHover,
		onHoverPattern,
		shouldFocusBlock,
		clientId,
		rootClientId,
		__experimentalInsertionIndex,
		isAppender,
	]
);
*/
