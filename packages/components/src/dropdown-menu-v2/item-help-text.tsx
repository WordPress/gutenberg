/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import * as Styled from './styles';

export const DropdownMenuItemHelpText = forwardRef<
	HTMLSpanElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function DropdownMenuItemHelpText( props, ref ) {
	return (
		<Styled.DropdownMenuItemHelpText
			numberOfLines={ 2 }
			ref={ ref }
			{ ...props }
		/>
	);
} );
