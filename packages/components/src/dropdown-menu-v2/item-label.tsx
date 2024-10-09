/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import * as Styled from './styles';

export const DropdownMenuItemLabel = forwardRef<
	HTMLSpanElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function DropdownMenuItemLabel( props, ref ) {
	return (
		<Styled.DropdownMenuItemLabel
			numberOfLines={ 1 }
			ref={ ref }
			{ ...props }
		/>
	);
} );
