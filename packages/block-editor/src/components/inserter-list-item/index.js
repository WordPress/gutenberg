/**
 * Internal dependencies
 */
import InserterListItemBase from './base';
import { useCustomInserterItems } from '../inserter/custom-inserter-items-context';

export default function InserterListItem( props ) {
	const customInserterItems = useCustomInserterItems();
	const CustomInserterItem = customInserterItems[ props.item.id ];

	if ( CustomInserterItem ) {
		return <CustomInserterItem { ...props } />;
	}

	return <InserterListItemBase { ...props } />;
}
