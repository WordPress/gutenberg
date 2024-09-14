/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { SearchControl, Button } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import BlockManagerCategory from './category';

export default function BlockManager() {
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ search, setSearch ] = useState( '' );
	const { showBlockTypes } = unlock( useDispatch( editorStore ) );

	const {
		blockTypes,
		categories,
		hasBlockSupport,
		isMatchingSearchTerm,
		numberOfHiddenBlocks,
	} = useSelect( ( select ) => {
		// Some hidden blocks become unregistered
		// by removing for instance the plugin that registered them, yet
		// they're still remain as hidden by the user's action.
		// We consider "hidden", blocks which were hidden and
		// are still registered.
		const _blockTypes = select( blocksStore ).getBlockTypes();
		const hiddenBlockTypes = (
			select( preferencesStore ).get( 'core', 'hiddenBlockTypes' ) ?? []
		).filter( ( hiddenBlock ) => {
			return _blockTypes.some(
				( registeredBlock ) => registeredBlock.name === hiddenBlock
			);
		} );

		return {
			blockTypes: _blockTypes,
			categories: select( blocksStore ).getCategories(),
			hasBlockSupport: select( blocksStore ).hasBlockSupport,
			isMatchingSearchTerm: select( blocksStore ).isMatchingSearchTerm,
			numberOfHiddenBlocks:
				Array.isArray( hiddenBlockTypes ) && hiddenBlockTypes.length,
		};
	}, [] );

	function enableAllBlockTypes( newBlockTypes ) {
		const blockNames = newBlockTypes.map( ( { name } ) => name );
		showBlockTypes( blockNames );
	}

	const filteredBlockTypes = blockTypes.filter(
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
		const count = filteredBlockTypes.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filteredBlockTypes?.length, search, debouncedSpeak ] );

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
						__next40pxDefaultSize
						variant="link"
						onClick={ () =>
							enableAllBlockTypes( filteredBlockTypes )
						}
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
				{ filteredBlockTypes.length === 0 && (
					<p className="editor-block-manager__no-results">
						{ __( 'No blocks found.' ) }
					</p>
				) }
				{ categories.map( ( category ) => (
					<BlockManagerCategory
						key={ category.slug }
						title={ category.title }
						blockTypes={ filteredBlockTypes.filter(
							( blockType ) =>
								blockType.category === category.slug
						) }
					/>
				) ) }
				<BlockManagerCategory
					title={ __( 'Uncategorized' ) }
					blockTypes={ filteredBlockTypes.filter(
						( { category } ) => ! category
					) }
				/>
			</div>
		</div>
	);
}
