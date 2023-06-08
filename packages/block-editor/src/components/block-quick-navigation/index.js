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
import { getBlockType, __experimentalGetBlockLabel } from '@wordpress/blocks';

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
	const { name, attributes, isSelected } = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockAttributes,
				isBlockSelected,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );
			return {
				name: getBlockName( clientId ),
				attributes: getBlockAttributes( clientId ),
				isSelected:
					isBlockSelected( clientId ) ||
					hasSelectedInnerBlock( clientId, /* deep: */ true ),
			};
		},
		[ clientId ]
	);
	const { selectBlock } = useDispatch( blockEditorStore );
	const blockType = getBlockType( name );
	return (
		<Button
			key={ clientId }
			isPressed={ isSelected }
			onClick={ () => selectBlock( clientId ) }
		>
			<HStack justify="flex-start">
				<BlockIcon icon={ blockType.icon } />
				<FlexItem>
					{ __experimentalGetBlockLabel(
						blockType,
						attributes,
						'list-view'
					) }
				</FlexItem>
			</HStack>
		</Button>
	);
}
