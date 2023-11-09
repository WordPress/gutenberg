/**
 * Internal dependencies
 */
import { CustomSelectItem as SelectItem } from './styles';
import { type CustomSelectItemProps } from './types';

function CustomSelectItem( { ...props }: CustomSelectItemProps ) {
	return <SelectItem { ...props } />;
}

export default CustomSelectItem;
