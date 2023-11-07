/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { CustomSelectItem as SelectItem } from './styles';
import { type CustomSelectItemProps } from './types';

function CustomSelectItem( {
	children,
	value,
	...rest
}: CustomSelectItemProps ) {
	// if only one child is added, it can be used as an unset `value`
	const childAsString =
		Children.count( children ) === 1 ? children : undefined;

	return (
		<SelectItem
			{ ...rest }
			className="select-item"
			value={ value ? value : childAsString }
			children={ children ? children : value }
		/>
	);
}

export default CustomSelectItem;
