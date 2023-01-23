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
	__experimentalGetMatchingVariation as getMatchingVariation,
} from '@wordpress/block-editor';
import { Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useScopedBlockVariations } from '../utils';

export default function QueryPlaceholder( {
	attributes,
	clientId,
	name,
	openPatternSelectionModal,
	setAttributes,
} ) {
	const [ isStartingBlank, setIsStartingBlank ] = useState( false );
	const blockProps = useBlockProps();

	const { blockType, allVariations, hasPatterns } = useSelect(
		( select ) => {
			const { getBlockVariations, getBlockType } = select( blocksStore );
			const { getBlockRootClientId, getPatternsByBlockTypes } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );

			return {
				blockType: getBlockType( name ),
				allVariations: getBlockVariations( name ),
				hasPatterns: !! getPatternsByBlockTypes( name, rootClientId )
					.length,
			};
		},
		[ name, clientId ]
	);

	const matchingVariation = getMatchingVariation( attributes, allVariations );
	const icon =
		matchingVariation?.icon?.src ||
		matchingVariation?.icon ||
		blockType?.icon?.src;
	const label = matchingVariation?.title || blockType?.title;
	if ( isStartingBlank ) {
		return (
			<QueryVariationPicker
				clientId={ clientId }
				attributes={ attributes }
				setAttributes={ setAttributes }
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
						variant="primary"
						onClick={ openPatternSelectionModal }
					>
						{ __( 'Choose' ) }
					</Button>
				) }

				<Button
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

function QueryVariationPicker( {
	clientId,
	attributes,
	setAttributes,
	icon,
	label,
} ) {
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
					if ( variation.attributes ) {
						setAttributes( {
							...variation.attributes,
							query: {
								...variation.attributes.query,
								postType:
									attributes.query.postType ||
									variation.attributes.query.postType,
							},
							namespace: attributes.namespace,
						} );
					}
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
