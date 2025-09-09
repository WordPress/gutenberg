/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	TextControl,
	ToggleControl,
	__experimentalVStack as VStack,
	__experimentalTruncate as Truncate,
	Flex,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

export default function BlockQuickNavigation( { clientIds, onSelect } ) {
	if ( ! clientIds.length ) {
		return null;
	}
	return (
		<VStack spacing={ 1 }>
			{ clientIds.map( ( clientId ) => (
				<BlockQuickNavigationItem
					onSelect={ onSelect }
					key={ clientId }
					clientId={ clientId }
				/>
			) ) }
		</VStack>
	);
}

function BlockQuickNavigationItem( { clientId, onSelect } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const { isSelected, block } = useSelect(
		( select ) => {
			const { isBlockSelected, hasSelectedInnerBlock, getBlock } =
				select( blockEditorStore );

			return {
				isSelected:
					isBlockSelected( clientId ) ||
					hasSelectedInnerBlock( clientId, /* deep: */ true ),
				block: getBlock( clientId ),
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes, selectBlock } =
		useDispatch( blockEditorStore );

	// Get content attributes for this block
	const contentAttributes = [];
	if ( block?.name ) {
		const blockType = getBlockType( block.name );
		if ( blockType?.attributes ) {
			Object.entries( blockType.attributes ).forEach(
				( [ attrName, attrDef ] ) => {
					if ( attrDef.role === 'content' ) {
						contentAttributes.push( {
							name: attrName,
							definition: attrDef,
							value: block.attributes?.[ attrName ],
						} );
					}
				}
			);
		}
	}

	return (
		<VStack spacing={ 1 }>
			<Button
				__next40pxDefaultSize
				isPressed={ isSelected }
				onClick={ async () => {
					await selectBlock( clientId );
					if ( onSelect ) {
						onSelect( clientId );
					}
				} }
			>
				<Flex>
					<FlexItem>
						<BlockIcon icon={ blockInformation?.icon } />
					</FlexItem>
					<FlexBlock style={ { textAlign: 'left' } }>
						<Truncate>{ blockTitle }</Truncate>
					</FlexBlock>
				</Flex>
			</Button>

			{ /* Content attribute controls */ }
			{ contentAttributes.map( ( attr ) => {
				const handleChange = ( newValue ) => {
					updateBlockAttributes( clientId, {
						[ attr.name ]: newValue,
					} );
				};

				if ( attr.definition.type === 'string' ) {
					return (
						<TextControl
							key={ attr.name }
							label={ attr.name }
							value={ attr.value || '' }
							onChange={ handleChange }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					);
				}

				if ( attr.definition.type === 'boolean' ) {
					return (
						<ToggleControl
							key={ attr.name }
							label={ attr.name }
							checked={ attr.value || false }
							onChange={ handleChange }
							__nextHasNoMarginBottom
						/>
					);
				}

				if ( attr.definition.type === 'rich-text' ) {
					return (
						<TextControl
							key={ attr.name }
							label={ attr.name }
							value={ attr.value || '' }
							onChange={ handleChange }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					);
				}

				return null;
			} ) }
		</VStack>
	);
}
