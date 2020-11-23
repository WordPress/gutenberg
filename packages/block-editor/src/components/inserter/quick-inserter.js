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
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';

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

const preventArrowKeysPropagation = ( event ) => {
	if (
		[ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].includes( event.keyCode )
	) {
		// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
		event.stopPropagation();
	}
};
const stopKeyPropagation = ( event ) => event.stopPropagation();

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

	const [ patterns ] = usePatternsState( onInsertBlocks );
	const showPatterns =
		! destinationRootClientId && patterns.length && !! filterValue;
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
	/* eslint-enable jsx-a11y/no-autofocus, jsx-a11y/no-static-element-interactions */
}
