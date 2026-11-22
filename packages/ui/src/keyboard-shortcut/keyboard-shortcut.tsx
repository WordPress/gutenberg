import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef, Fragment } from '@wordpress/element';
import { displayShortcutList, shortcutAriaLabel } from '@wordpress/keycodes';
import { VisuallyHidden } from '../visually-hidden';
import type { KeyboardShortcutProps } from './types';

/**
 * Displays a static keyboard shortcut with a readable text alternative.
 * Use the interactive shortcut utilities for buttons and menu items.
 */
export const KeyboardShortcut = forwardRef<
	HTMLElement,
	KeyboardShortcutProps
>( function UnforwardedKeyboardShortcut(
	{ keyCombination, label, keyClassName, render, ...props },
	ref
) {
	const { character, modifier = 'undefined' } = keyCombination;
	const characters = Array.isArray( character ) ? character : [ character ];
	const formatted = displayShortcutList[ modifier ]( characters[ 0 ] ?? '' );
	const prefix = formatted.slice( 0, -1 );
	const keys = Array.isArray( character ) ? character : formatted.slice( -1 );
	const readableLabel =
		label ||
		shortcutAriaLabel[ modifier ](
			Array.isArray( character ) ? character.join( '' ) : character
		);

	return useRender( {
		render,
		defaultTagName: 'kbd',
		ref,
		props: mergeProps< 'kbd' >( props, {
			dir: 'ltr',
			children: (
				<>
					<VisuallyHidden render={ <span /> }>
						{ readableLabel }
					</VisuallyHidden>
					<span aria-hidden="true">
						{ prefix.map( ( key, index ) =>
							key === '+' ? (
								<Fragment key={ index }>{ key }</Fragment>
							) : (
								<kbd key={ index } className={ keyClassName }>
									{ key }
								</kbd>
							)
						) }
						{ keys.map( ( key, index ) => (
							<kbd key={ index } className={ keyClassName }>
								{ key }
							</kbd>
						) ) }
					</span>
				</>
			),
		} ),
	} );
} );
