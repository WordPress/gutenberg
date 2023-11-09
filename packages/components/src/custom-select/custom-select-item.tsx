/**
 * Internal dependencies
 */
import { CustomSelectItem as SelectItem } from './styles';
import { type CustomSelectItemProps } from './types';

function CustomSelectItem( { ...rest }: CustomSelectItemProps ) {
	return <SelectItem { ...rest } className="select-item" />;
}

export default CustomSelectItem;
