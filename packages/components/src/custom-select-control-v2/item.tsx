/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { CustomSelectItemProps } from './types';
import type { WordPressComponentProps } from '../context';
import * as Styled from './styles';
import { CustomSelectContext } from './custom-select';

function UnforwardedCustomSelectItem( {
	children,
	...props
}: WordPressComponentProps< CustomSelectItemProps, 'div', false > ) {
	const customSelectContext = useContext( CustomSelectContext );
	return (
		<Styled.SelectItem
			store={ customSelectContext?.store }
			size={ customSelectContext?.size ?? 'default' }
			{ ...props }
		>
			{ children ?? props.value }
			<Styled.SelectedItemCheck>
				<Icon icon={ check } />
			</Styled.SelectedItemCheck>
		</Styled.SelectItem>
	);
}

export const CustomSelectItem = forwardRef( UnforwardedCustomSelectItem );

CustomSelectItem.displayName = 'CustomSelectControlV2.Item';

export default CustomSelectItem;
