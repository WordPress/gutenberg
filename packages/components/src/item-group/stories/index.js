/* eslint-disable no-alert */
/* globals alert */
/**
 * External dependencies
 */
import { boolean, select } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import { ItemGroup, Item } from '..';
import { Flyout } from '../../flyout';
import Button from '../../button';

export default {
	component: ItemGroup,
	title: 'Components (Experimental)/ItemGroup',
};

// Using `unset` instead of `undefined` as Storybook seems to sometimes pass an
// empty string instead of `undefined`, which is not ideal.
// https://github.com/storybookjs/storybook/issues/800
const PROP_UNSET = 'unset';

export const _default = () => {
	const itemGroupProps = {
		isBordered: boolean( 'ItemGroup: isBordered', false ),
		isSeparated: boolean( 'ItemGroup: isSeparated', false ),
		isRounded: boolean( 'ItemGroup: isRounded', true ),
		size: select(
			'ItemGroup: size',
			[ 'small', 'medium', 'large' ],
			'medium'
		),
	};

	const itemProps = {
		size: select(
			'Item 1: size',
			{
				'unset (defaults to the value set on the <ItemGroup> parent)': PROP_UNSET,
				small: 'small',
				medium: 'medium',
				large: 'large',
			},
			PROP_UNSET
		),
		isAction: boolean( 'Item 1: isAction', true ),
	};

	// Do not pass the `size` prop when its value is `undefined`.
	// This allows the `Item` component to use the values that are set on the
	// parent `ItemGroup` component by default.
	if ( itemProps.size === PROP_UNSET ) {
		delete itemProps.size;
	}

	return (
		<ItemGroup style={ { width: '350px' } } { ...itemGroupProps }>
			<Item { ...itemProps } onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item isAction onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item isAction onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item isAction onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
		</ItemGroup>
	);
};

export const dropdown = () => (
	<Flyout
		style={ { width: '350px' } }
		trigger={ <Button>Open Popover</Button> }
	>
		<ItemGroup style={ { padding: 4 } }>
			<Item isAction onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item isAction onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item isAction onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item isAction onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
		</ItemGroup>
	</Flyout>
);
/* eslint-enable no-alert */
