/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';
import {
	__experimentalGetBlockLabel,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';

export default function BlockQuickNavigation( { clientIds } ) {
	if ( ! clientIds.length ) {
		return null;
	}
	return (
		<VStack spacing={ 1 }>
			{ clientIds.map( ( clientId ) => (
				<BlockQuickNavigationItem
					key={ clientId }
					clientId={ clientId }
				/>
			) ) }
		</VStack>
	);
}

function BlockQuickNavigationItem( { clientId } ) {
	const { name, icon, isSelected } = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockAttributes,
				isBlockSelected,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );
			const { getBlockType } = select( blocksStore );

			const blockType = getBlockType( getBlockName( clientId ) );
			const attributes = getBlockAttributes( clientId );

			return {
				name:
					blockType &&
					__experimentalGetBlockLabel(
						blockType,
						attributes,
						'list-view'
					),
				icon: blockType?.icon,
				isSelected:
					isBlockSelected( clientId ) ||
					hasSelectedInnerBlock( clientId, /* deep: */ true ),
			};
		},
		[ clientId ]
	);
	const { selectBlock } = useDispatch( blockEditorStore );

	return (
		<Button
			isPressed={ isSelected }
			onClick={ () => selectBlock( clientId ) }
		>
			<HStack justify="flex-start">
				<BlockIcon icon={ icon } />
				<FlexItem>{ name }</FlexItem>
			</HStack>
		</Button>
	);
}
