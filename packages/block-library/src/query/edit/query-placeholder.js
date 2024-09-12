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
	useBlockProps,
	store as blockEditorStore,
	__experimentalBlockVariationPicker,
} from '@wordpress/block-editor';
import { Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useScopedBlockVariations, useBlockNameForPatterns } from '../utils';

export default function QueryPlaceholder( {
	attributes,
	clientId,
	name,
	openPatternSelectionModal,
} ) {
	const [ isStartingBlank, setIsStartingBlank ] = useState( false );
	const blockProps = useBlockProps();
	const blockNameForPatterns = useBlockNameForPatterns(
		clientId,
		attributes
	);
	const { blockType, activeBlockVariation, hasPatterns } = useSelect(
		( select ) => {
			const { getActiveBlockVariation, getBlockType } =
				select( blocksStore );
			const { getBlockRootClientId, getPatternsByBlockTypes } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			return {
				blockType: getBlockType( name ),
				activeBlockVariation: getActiveBlockVariation(
					name,
					attributes
				),
				hasPatterns: !! getPatternsByBlockTypes(
					blockNameForPatterns,
					rootClientId
				).length,
			};
		},
		[ name, blockNameForPatterns, clientId, attributes ]
	);
	const icon =
		activeBlockVariation?.icon?.src ||
		activeBlockVariation?.icon ||
		blockType?.icon?.src;
	const label = activeBlockVariation?.title || blockType?.title;
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
			<Placeholder
				icon={ icon }
				label={ label }
				instructions={ __(
					'Choose a pattern for the query loop or start blank.'
				) }
			>
				{ !! hasPatterns && (
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ openPatternSelectionModal }
					>
						{ __( 'Choose' ) }
					</Button>
				) }

				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => {
						setIsStartingBlank( true );
					} }
				>
					{ __( 'Start blank' ) }
				</Button>
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
