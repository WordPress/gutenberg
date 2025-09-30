/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import { useState } from '@wordpress/element';
import {
	store as blockEditorStore,
	__experimentalBlockVariationPicker,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useScopedBlockVariations } from '../utils';
import { useBlockPatterns } from './pattern-selection';
import QueryToolbar from './query-toolbar';

export default function QueryPlaceholder( {
	attributes,
	clientId,
	name,
	openPatternSelectionModal,
} ) {
	const [ isStartingBlank, setIsStartingBlank ] = useState( false );
	const [ containerWidth, setContainerWidth ] = useState( 0 );

	// Use ResizeObserver to monitor container width.
	const resizeObserverRef = useResizeObserver( ( [ entry ] ) => {
		setContainerWidth( entry.contentRect.width );
	} );

	const SMALL_CONTAINER_BREAKPOINT = 160;

	const isSmallContainer =
		containerWidth > 0 && containerWidth < SMALL_CONTAINER_BREAKPOINT;

	const { blockType, activeBlockVariation } = useSelect(
		( select ) => {
			const { getActiveBlockVariation, getBlockType } =
				select( blocksStore );
			return {
				blockType: getBlockType( name ),
				activeBlockVariation: getActiveBlockVariation(
					name,
					attributes
				),
			};
		},
		[ name, attributes ]
	);
	const hasPatterns = !! useBlockPatterns( clientId, attributes ).length;
	const icon =
		activeBlockVariation?.icon?.src ||
		activeBlockVariation?.icon ||
		blockType?.icon?.src;
	const label = activeBlockVariation?.title || blockType?.title;
	const blockProps = useBlockProps( {
		ref: resizeObserverRef,
	} );

	if ( isStartingBlank ) {
		return (
			<QueryVariationPicker
				clientId={ clientId }
				attributes={ attributes }
				icon={ icon }
				label={ label }
			/>
		);
	}
	return (
		<div { ...blockProps }>
			<BlockControls>
				<QueryToolbar
					clientId={ clientId }
					attributes={ attributes }
					hasInnerBlocks={ false }
				/>
			</BlockControls>
			<Placeholder
				className="block-editor-media-placeholder"
				icon={ ! isSmallContainer && icon }
				label={ ! isSmallContainer && label }
				instructions={
					! isSmallContainer &&
					__( 'Choose a pattern for the query loop or start blank.' )
				}
				withIllustration={ isSmallContainer }
			>
				{ !! hasPatterns && ! isSmallContainer && (
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ openPatternSelectionModal }
					>
						{ __( 'Choose' ) }
					</Button>
				) }

				{ ! isSmallContainer && (
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ () => {
							setIsStartingBlank( true );
						} }
					>
						{ __( 'Start blank' ) }
					</Button>
				) }
			</Placeholder>
		</div>
	);
}

function QueryVariationPicker( { clientId, attributes, icon, label } ) {
	const scopeVariations = useScopedBlockVariations( attributes );
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<__experimentalBlockVariationPicker
				icon={ icon }
				label={ label }
				variations={ scopeVariations }
				onSelect={ ( variation ) => {
					if ( variation.innerBlocks ) {
						replaceInnerBlocks(
							clientId,
							createBlocksFromInnerBlocksTemplate(
								variation.innerBlocks
							),
							false
						);
					}
				} }
			/>
		</div>
	);
}
