/**
 * Internal dependencies
 */
import { CustomSelectItem as SelectItem } from './styles';
import { type CustomSelectItemProps } from './types';

function CustomSelectItem( { children, ...rest }: CustomSelectItemProps ) {
	return (
		<SelectItem className="select-item" { ...rest }>
			{ children }
		</SelectItem>
	);
}

export default CustomSelectItem;
