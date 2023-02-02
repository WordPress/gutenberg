/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const PatternEdit = ( { attributes, clientId, setAttributes } ) => {
	const { selectedPattern, isContentLocked, patternsInSameCategories } =
		useSelect(
			( select ) => {
				const {
					__experimentalGetParsedPattern: getParsedPattern,
					__unstableGetContentLockingParent: getContentLockingParent,
					__experimentalGetAllowedPatterns: getAllowedPatterns,
				} = select( blockEditorStore );
				const _selectedPattern = getParsedPattern( attributes.slug );
				return {
					selectedPattern: _selectedPattern,
					isContentLocked:
						! getContentLockingParent( clientId ) &&
						attributes.templateLock === 'contentOnly',
					patternsInSameCategories: getAllowedPatterns().filter(
						( pattern ) =>
							pattern.name !== _selectedPattern.name &&
							pattern.categories?.length > 0 &&
							pattern.categories?.some(
								( category ) =>
									_selectedPattern.categories?.length > 0 &&
									_selectedPattern.categories?.includes(
										category
									)
							)
					),
				};
			},
			[ attributes.slug, attributes.templateLock, clientId ]
		);

	const { replaceBlocks, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// Run this effect when the component loads.
	// This adds the Pattern's contents to the post.
	// This change won't be saved.
	// It will continue to pull from the pattern file unless changes are made to its respective template part.
	useEffect( () => {
		if ( ! isContentLocked && selectedPattern?.blocks ) {
			// We batch updates to block list settings to avoid triggering cascading renders
			// for each container block included in a tree and optimize initial render.
			// Since the above uses microtasks, we need to use a microtask here as well,
			// because nested pattern blocks cannot be inserted if the parent block supports
			// inner blocks but doesn't have blockSettings in the state.
			window.queueMicrotask( () => {
				__unstableMarkNextChangeAsNotPersistent();
				replaceBlocks( clientId, selectedPattern.blocks );
			} );
		}
	}, [ clientId, selectedPattern?.blocks ] );

	const blockProps = useBlockProps();
	const innerBlockProps = useInnerBlocksProps( blockProps, {
		templateLock: attributes.templateLock,
		onInput: () => {},
		onChange: ( blocks ) => {
			replaceBlocks( clientId, blocks );
		},
		value: selectedPattern?.blocks ?? [],
	} );

	const canShuffle = isContentLocked && patternsInSameCategories.length > 0;

	function shuffle() {
		const randomIndex = Math.floor(
			// We explicitly want the randomness here for shuffling.
			// eslint-disable-next-line no-restricted-syntax
			Math.random() * patternsInSameCategories.length
		);
		const nextPattern = patternsInSameCategories[ randomIndex ];

		setAttributes( { slug: nextPattern.name } );
	}

	return (
		<>
			<div { ...( canShuffle ? innerBlockProps : blockProps ) } />
			{ canShuffle && (
				<BlockControls group="other">
					<ToolbarButton onClick={ shuffle }>
						{ __( 'Shuffle' ) }
					</ToolbarButton>
				</BlockControls>
			) }
		</>
	);
};

export default PatternEdit;
