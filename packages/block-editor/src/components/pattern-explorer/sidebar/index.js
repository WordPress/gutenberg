/**
 * WordPress dependencies
 */
import { SearchControl } from '@wordpress/components';
import {
	// useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockPatternsTabs from '../../inserter/block-patterns-tab';
import SearchResults from './search-results';

function PatternExplorerSidebar( { rootClientId, setSelectedPattern } ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ selectedPatternCategory, setSelectedPatternCategory ] = useState(
		null
	);

	// const isMobile = useViewportMatch( 'medium', '<' );
	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		// onClose: () => setIsInserterOpened( false ),
	} );
	const onClickPatternCategory = useCallback(
		( patternCategory ) => {
			setSelectedPatternCategory( patternCategory );
		},
		[ setSelectedPatternCategory ]
	);

	const onSelectPattern = useCallback( ( pattern ) => {
		setSelectedPattern( pattern );
	}, [] );
	const baseCssClass = 'block-editor-pattern-explorer__sidebar';
	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className={ baseCssClass }
		>
			<div className={ `${ baseCssClass }__main-area` }>
				{ /* the following div is necessary to fix the sticky position of the search form */ }
				<div className={ `${ baseCssClass }__content` }>
					<SearchControl
						className={ `${ baseCssClass }__search` }
						// className="block-editor-inserter__search"
						onChange={ ( value ) => {
							setFilterValue( value );
						} }
						value={ filterValue }
						label={ __( 'Search for patterns' ) }
						placeholder={ __( 'Search for patterns' ) }
					/>
					{ !! filterValue && (
						<SearchResults
							filterValue={ filterValue }
							onSelect={ onSelectPattern }
							rootClientId={ rootClientId }
							// __experimentalInsertionIndex={
							// 	__experimentalInsertionIndex
							// }
						/>
					) }
					{ ! filterValue && (
						<BlockPatternsTabs
							rootClientId={ rootClientId }
							onSelectPattern={ onSelectPattern }
							onClickCategory={ onClickPatternCategory }
							selectedCategory={ selectedPatternCategory }
							isDraggable={ false }
						/>
					) }
				</div>
			</div>
		</div>
	);
}

export default PatternExplorerSidebar;
