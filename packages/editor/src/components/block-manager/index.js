/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { SearchControl, Button } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDebounce, compose } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import BlockManagerCategory from './category';

function BlockManager( {
	blockTypes,
	categories,
	hasBlockSupport,
	isMatchingSearchTerm,
	numberOfHiddenBlocks,
	enableAllBlockTypes,
} ) {
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ search, setSearch ] = useState( '' );

	// Filtering occurs here (as opposed to `withSelect`) to avoid
	// wasted renders by consequence of `Array#filter` producing
	// a new value reference on each call.
	blockTypes = blockTypes.filter(
		( blockType ) =>
			hasBlockSupport( blockType, 'inserter', true ) &&
			( ! search || isMatchingSearchTerm( blockType, search ) ) &&
			( ! blockType.parent ||
				blockType.parent.includes( 'core/post-content' ) )
	);

	// Announce search results on change
	useEffect( () => {
		if ( ! search ) {
			return;
		}
		const count = blockTypes.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ blockTypes.length, search, debouncedSpeak ] );

	return (
		<div className="editor-block-manager__content">
			{ !! numberOfHiddenBlocks && (
				<div className="editor-block-manager__disabled-blocks-count">
					{ sprintf(
						/* translators: %d: number of blocks. */
						_n(
							'%d block is hidden.',
							'%d blocks are hidden.',
							numberOfHiddenBlocks
						),
						numberOfHiddenBlocks
					) }
					<Button
						variant="link"
						onClick={ () => enableAllBlockTypes( blockTypes ) }
					>
						{ __( 'Reset' ) }
					</Button>
				</div>
			) }
			<SearchControl
				__nextHasNoMarginBottom
				label={ __( 'Search for a block' ) }
				placeholder={ __( 'Search for a block' ) }
				value={ search }
				onChange={ ( nextSearch ) => setSearch( nextSearch ) }
				className="editor-block-manager__search"
			/>
			<div
				tabIndex="0"
				role="region"
				aria-label={ __( 'Available block types' ) }
				className="editor-block-manager__results"
			>
				{ blockTypes.length === 0 && (
					<p className="editor-block-manager__no-results">
						{ __( 'No blocks found.' ) }
					</p>
				) }
				{ categories.map( ( category ) => (
					<BlockManagerCategory
						key={ category.slug }
						title={ category.title }
						blockTypes={ blockTypes.filter(
							( blockType ) =>
								blockType.category === category.slug
						) }
					/>
				) ) }
				<BlockManagerCategory
					title={ __( 'Uncategorized' ) }
					blockTypes={ blockTypes.filter(
						( { category } ) => ! category
					) }
				/>
			</div>
		</div>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getBlockTypes,
			getCategories,
			hasBlockSupport,
			isMatchingSearchTerm,
		} = select( blocksStore );
		const { get } = select( preferencesStore );

		// Some hidden blocks become unregistered
		// by removing for instance the plugin that registered them, yet
		// they're still remain as hidden by the user's action.
		// We consider "hidden", blocks which were hidden and
		// are still registered.
		const blockTypes = getBlockTypes();
		const hiddenBlockTypes = (
			get( 'core', 'hiddenBlockTypes' ) ?? []
		).filter( ( hiddenBlock ) => {
			return blockTypes.some(
				( registeredBlock ) => registeredBlock.name === hiddenBlock
			);
		} );
		const numberOfHiddenBlocks =
			Array.isArray( hiddenBlockTypes ) && hiddenBlockTypes.length;

		return {
			blockTypes,
			categories: getCategories(),
			hasBlockSupport,
			isMatchingSearchTerm,
			numberOfHiddenBlocks,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { showBlockTypes } = unlock( dispatch( editorStore ) );
		return {
			enableAllBlockTypes: ( blockTypes ) => {
				const blockNames = blockTypes.map( ( { name } ) => name );
				showBlockTypes( blockNames );
			},
		};
	} ),
] )( BlockManager );
