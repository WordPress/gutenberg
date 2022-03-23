/**
 * External dependencies
 */
import { filter, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { SearchControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import BlockManagerCategory from './category';
import useHiddenBlockTypes from './use-hidden-block-types';

export default function BlockManager( { scope } ) {
	const {
		blockTypes,
		categories,
		hasBlockSupport,
		isMatchingSearchTerm,
	} = useSelect( ( select ) => {
		const {
			getBlockTypes,
			getCategories,
			hasBlockSupport: _hasBlockSupport,
			isMatchingSearchTerm: _isMatchingSearchTerm,
		} = select( blocksStore );

		return {
			blockTypes: getBlockTypes(),
			categories: getCategories(),
			hasBlockSupport: _hasBlockSupport,
			isMatchingSearchTerm: _isMatchingSearchTerm,
		};
	} );

	const { hiddenBlockTypes } = useHiddenBlockTypes( scope );
	const numberOfHiddenBlocks = hiddenBlockTypes?.length ?? 0;

	const debouncedSpeak = useDebounce( speak, 500 );
	const [ search, setSearch ] = useState( '' );

	// Filtering occurs here (as opposed to `withSelect`) to avoid
	// wasted renders by consequence of `Array#filter` producing
	// a new value reference on each call.
	const filteredBlockTypes = blockTypes.filter(
		( blockType ) =>
			hasBlockSupport( blockType, 'inserter', true ) &&
			( ! search || isMatchingSearchTerm( blockType, search ) ) &&
			( ! blockType.parent ||
				includes( blockType.parent, 'core/post-content' ) )
	);

	// Announce search results on change
	useEffect( () => {
		if ( ! search ) {
			return;
		}
		const count = filteredBlockTypes.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filteredBlockTypes.length, search, debouncedSpeak ] );

	return (
		<div className="block-editor-block-manager__content">
			{ !! numberOfHiddenBlocks && (
				<div className="block-editor-block-manager__disabled-blocks-count">
					{ sprintf(
						/* translators: %d: number of blocks. */
						_n(
							'%d block is hidden.',
							'%d blocks are hidden.',
							numberOfHiddenBlocks
						),
						numberOfHiddenBlocks
					) }
				</div>
			) }
			<SearchControl
				label={ __( 'Search for a block' ) }
				placeholder={ __( 'Search for a block' ) }
				value={ search }
				onChange={ ( nextSearch ) => setSearch( nextSearch ) }
				className="block-editor-block-manager__search"
			/>
			<div
				tabIndex="0"
				role="region"
				aria-label={ __( 'Available block types' ) }
				className="block-editor-block-manager__results"
			>
				{ filteredBlockTypes.length === 0 && (
					<p className="block-editor-block-manager__no-results">
						{ __( 'No blocks found.' ) }
					</p>
				) }
				{ categories.map( ( category ) => (
					<BlockManagerCategory
						key={ category.slug }
						scope={ scope }
						title={ category.title }
						blockTypes={ filter( filteredBlockTypes, {
							category: category.slug,
						} ) }
					/>
				) ) }
				<BlockManagerCategory
					scope={ scope }
					title={ __( 'Uncategorized' ) }
					blockTypes={ filter(
						filteredBlockTypes,
						( { category } ) => ! category
					) }
				/>
			</div>
		</div>
	);
}
