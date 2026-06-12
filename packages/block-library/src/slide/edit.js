/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __( 'Type / to choose a block' ),
		},
	],
];

export default function Edit( { clientId, context = {} } ) {
	const editorActiveSlideIndex =
		context[ 'core/slider-editorActiveSlideIndex' ] ?? 0;
	const { activeSlideIndex, blockIndex, slideCount } = useSelect(
		( select ) => {
			const { getBlockCount, getBlockIndex, getBlockRootClientId } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			const innerBlockCount = rootClientId
				? getBlockCount( rootClientId )
				: 0;

			return {
				activeSlideIndex: Math.max(
					0,
					Math.min(
						editorActiveSlideIndex,
						Math.max( innerBlockCount - 1, 0 )
					)
				),
				blockIndex: getBlockIndex( clientId ),
				slideCount: innerBlockCount,
			};
		},
		[ clientId, editorActiveSlideIndex ]
	);
	const isActive = blockIndex === activeSlideIndex;
	const isPrevious = blockIndex === activeSlideIndex - 1;
	const isNext = blockIndex === activeSlideIndex + 1;
	const isFirst = blockIndex === 0;
	const isLast = blockIndex === slideCount - 1;
	const isHidden = ! isActive && ! isPrevious && ! isNext;
	const blockProps = useBlockProps( {
		className: clsx( {
			'is-editor-active-slide': isActive,
			'is-editor-previous-slide': isPrevious,
			'is-editor-next-slide': isNext,
			'is-editor-first-slide': isFirst,
			'is-editor-last-slide': isLast,
		} ),
		hidden: isHidden,
		'aria-hidden': ! isActive,
		inert: ! isActive ? true : undefined,
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	return <section { ...innerBlocksProps } />;
}
