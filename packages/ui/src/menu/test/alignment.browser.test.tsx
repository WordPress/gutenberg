import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { archive } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports -- Browser geometry needs the same design tokens as a consumer.
import '@wordpress/theme/design-tokens.css';
import type { ComponentProps } from 'react';
import * as Menu from '../index';
import styles from '../style.module.css';

const prefixes = {
	none: undefined,
	icon: <Menu.PrefixIcon icon={ archive } />,
	tall: <span style={ { width: 32, height: 64 } }>A</span>,
};
const suffixes = {
	none: undefined,
	text: 'Draft',
	tall: <span style={ { width: 32, height: 80 } }>A</span>,
};
const shortcut = {
	displayShortcut: '⌘M',
	ariaKeyShortcut: 'Meta+m',
	label: 'Command M',
};

function TestItem( {
	kind,
	...props
}: Pick<
	ComponentProps< typeof Menu.Item >,
	'children' | 'prefix' | 'suffix' | 'shortcut'
> & {
	kind: 'action' | 'link' | 'checkbox' | 'radio' | 'submenu';
} ) {
	switch ( kind ) {
		case 'link':
			return <Menu.LinkItem { ...props } href="#collection" />;
		case 'checkbox':
			return <Menu.CheckboxItem { ...props } defaultChecked />;
		case 'radio':
			return (
				<Menu.RadioGroup defaultValue="collection">
					<Menu.RadioItem { ...props } value="collection" />
				</Menu.RadioGroup>
			);
		case 'submenu':
			return (
				<Menu.SubmenuRoot>
					<Menu.SubmenuTrigger { ...props } />
					<Menu.Popup>
						<Menu.Item>
							<Menu.ItemLabel>Collection</Menu.ItemLabel>
						</Menu.Item>
					</Menu.Popup>
				</Menu.SubmenuRoot>
			);
		default:
			return <Menu.Item { ...props } />;
	}
}

// These presentational slots have no accessible roles. Measure their rendered
// boxes to catch alignment regressions that computed CSS alone cannot detect.
function getSlot( item: HTMLElement, name: string ) {
	// eslint-disable-next-line testing-library/no-node-access -- Presentational slots have no semantic query.
	const slot = item.querySelector< HTMLElement >( `.${ styles[ name ] }` );
	expect( slot ).not.toBeNull();
	return slot!.getBoundingClientRect();
}

function center( rect: DOMRect ) {
	return rect.top + rect.height / 2;
}

describe.each( [ 'ltr', 'rtl' ] )( 'Menu alignment (%s)', ( dir ) => {
	describe.each( [
		'action',
		'link',
		'checkbox',
		'radio',
		'submenu',
	] as const )( '%s item', ( kind ) => {
		describe.each( [
			'single line',
			'wrapped label',
			'description',
			'wrapped label and description',
		] )( '%s', ( content ) => {
			it.each(
				Object.keys( prefixes ).flatMap( ( prefix ) =>
					Object.keys( suffixes ).flatMap( ( suffix ) =>
						[ false, true ].map( ( hasShortcut ) => ( {
							prefix: prefix as keyof typeof prefixes,
							suffix: suffix as keyof typeof suffixes,
							hasShortcut,
						} ) )
					)
				)
			)(
				'centers text and trailing content while keeping leading content at the top (prefix: $prefix, suffix: $suffix, shortcut: $hasShortcut)',
				async ( { prefix, suffix, hasShortcut } ) => {
					const labelText =
						content === 'single line'
							? 'Collection'
							: 'Move to another collection';
					await render(
						<Menu.Root defaultOpen>
							<Menu.Trigger>Open menu</Menu.Trigger>
							<Menu.Popup dir={ dir }>
								<TestItem
									kind={ kind }
									prefix={ prefixes[ prefix ] }
									suffix={ suffixes[ suffix ] }
									shortcut={
										hasShortcut ? shortcut : undefined
									}
								>
									<Menu.ItemLabel
										style={
											content.includes( 'wrapped label' )
												? { width: 80 }
												: undefined
										}
									>
										{ labelText }
									</Menu.ItemLabel>
									{ content.includes( 'description' ) && (
										<Menu.ItemDescription
											style={ { width: 160 } }
										>
											Move this item to a different
											collection in your library.
										</Menu.ItemDescription>
									) }
								</TestItem>
							</Menu.Popup>
						</Menu.Root>
					);

					const role = {
						action: 'menuitem',
						link: 'menuitem',
						checkbox: 'menuitemcheckbox',
						radio: 'menuitemradio',
						submenu: 'menuitem',
					}[ kind ];
					const item = screen.getByRole( role, {
						name: labelText,
					} );
					const itemRect = item.getBoundingClientRect();
					const contentRect = getSlot( item, 'item-content' );
					const label = getSlot( item, 'item-label' );
					const lineHeight = parseFloat(
						getComputedStyle( item ).lineHeight
					);

					expect( label.height ).toBeGreaterThan( 0 );
					if ( content === 'single line' ) {
						expect(
							Math.abs( label.height - lineHeight )
						).toBeLessThan( 0.5 );
					}
					if ( content.includes( 'wrapped label' ) ) {
						expect( label.height ).toBeGreaterThan( lineHeight );
					}
					for ( const slot of [
						'item-children',
						...( suffix !== 'none' ? [ 'item-suffix' ] : [] ),
						...( hasShortcut ? [ 'item-shortcut' ] : [] ),
						...( kind === 'submenu' ? [ 'item-trailing' ] : [] ),
					] ) {
						expect(
							Math.abs(
								center( getSlot( item, slot ) ) -
									center( itemRect )
							)
						).toBeLessThan( 0.5 );
					}
					for ( const slot of [
						...( prefix !== 'none' ? [ 'item-prefix' ] : [] ),
						...( kind === 'checkbox' || kind === 'radio'
							? [ 'item-selection-indicator' ]
							: [] ),
					] ) {
						const rect = getSlot( item, slot );
						expect(
							Math.abs( rect.top - contentRect.top )
						).toBeLessThan( 0.5 );
						expect( rect.bottom ).toBeLessThanOrEqual(
							itemRect.bottom
						);
					}
					if ( prefix === 'icon' ) {
						expect(
							Math.abs(
								center( getSlot( item, 'prefix-icon' ) ) -
									( contentRect.top + lineHeight / 2 )
							)
						).toBeLessThan( 0.5 );
					}
				}
			);
		} );
	} );
} );
