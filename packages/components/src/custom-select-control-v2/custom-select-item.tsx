/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { CustomSelectItemProps } from './types';
import type { WordPressComponentProps } from '../context';
import * as Styled from './styles';
import { CustomSelectContext } from './custom-select';

export function CustomSelectItem( {
	children,
	...props
}: WordPressComponentProps< CustomSelectItemProps, 'div', false > ) {
	const customSelectContext = useContext( CustomSelectContext );
	return (
		<Styled.CustomSelectItem
			store={ customSelectContext?.store }
			{ ...props }
		>
			{ children ?? props.value }
			<Styled.SelectedItemCheckmark
				style={ { width: '30px', height: '30px' } }
			>
				<Icon icon={ check } />
			</Styled.SelectedItemCheckmark>
		</Styled.CustomSelectItem>
	);
}

export default CustomSelectItem;
