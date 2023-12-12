/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { CustomSelectItemProps } from './types';
import * as Styled from './styles';
import { CustomSelectContext } from './custom-select';

function CustomSelectItem( { children, ...props }: CustomSelectItemProps ) {
	const customSelectContext = useContext( CustomSelectContext );
	return (
		<Styled.CustomSelectItem
			store={ customSelectContext?.store }
			{ ...props }
		>
			{ children ?? props.value }
			<Ariakit.SelectItemCheck />
		</Styled.CustomSelectItem>
	);
}

export default CustomSelectItem;
