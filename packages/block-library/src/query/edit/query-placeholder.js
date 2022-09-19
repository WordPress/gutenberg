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
			const {
				getBlockRootClientId,
				__experimentalGetPatternsByBlockTypes,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );

			return {
				blockType: getBlockType( name ),
				allVariations: getBlockVariations( name ),
				hasPatterns: !! __experimentalGetPatternsByBlockTypes(
					name,
					rootClientId
				).length,
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
				name={ name }
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
	name,
	attributes,
	setAttributes,
	icon,
	label,
} ) {
	const { defaultVariation, scopeVariations } = useSelect(
		( select ) => {
			const {
				getBlockVariations,
				getBlockType,
				getDefaultBlockVariation,
			} = select( blocksStore );

			return {
				blockType: getBlockType( name ),
				defaultVariation: getDefaultBlockVariation( name, 'block' ),
				scopeVariations: getBlockVariations( name, 'block' ),
			};
		},
		[ name ]
	);
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<__experimentalBlockVariationPicker
				icon={ icon }
				label={ label }
				variations={ scopeVariations }
				onSelect={ ( nextVariation = defaultVariation ) => {
					if ( nextVariation.attributes ) {
						setAttributes( {
							...nextVariation.attributes,
							query: {
								...nextVariation.attributes.query,
								postType:
									attributes.query.postType ||
									nextVariation.attributes.query.postType,
							},
						} );
					}
					if ( nextVariation.innerBlocks ) {
						replaceInnerBlocks(
							clientId,
							createBlocksFromInnerBlocksTemplate(
								nextVariation.innerBlocks
							),
							false
						);
					}
				} }
			/>
		</div>
	);
}
