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
import { Flyout } from '../../../flyout';
import Button from '../../../button';

export default {
	component: ItemGroup,
	title: 'Components (Experimental)/ItemGroup',
};

export const _default = () => {
	const itemGroupProps = {
		isBordered: boolean( 'ItemGroup: isBordered', true ),
		size: select(
			'ItemGroup: size',
			[ 'small', 'medium', 'large' ],
			'medium'
		),
		isSeparated: boolean( 'ItemGroup: isSeparated', false ),
		isRounded: boolean( 'ItemGroup: isRounded', false ),
	};

	const itemProps = {
		size: select(
			'Item 1: size',
			[ 'small', 'medium', 'large' ],
			'medium'
		),
		isAction: boolean( 'Item 1: isAction', true ),
	};

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
