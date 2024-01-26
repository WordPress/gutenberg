/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
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
				// set initial size of check to prevent inline overrides
				// due to legacy style options
				style={ {
					fontSize: 'initial',
				} }
			/>
		</Styled.CustomSelectItem>
	);
}

export default CustomSelectItem;
