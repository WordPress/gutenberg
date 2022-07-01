/**
 * Internal dependencies
 */
import InserterListItemBase from './base';

export default function InserterListItem( props ) {
	const { inserterItem: InserterItem } = props.item;

	if ( InserterItem ) {
		return <InserterItem { ...props } />;
	}

	return <InserterListItemBase { ...props } />;
}
