/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalVStack as VStack,
	__experimentalTruncate as Truncate,
	Flex,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';

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
	const { isSelected } = useSelect(
		( select ) => {
			const { isBlockSelected, hasSelectedInnerBlock } =
				select( blockEditorStore );

			return {
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
	);
}
