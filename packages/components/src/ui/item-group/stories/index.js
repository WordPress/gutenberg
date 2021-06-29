/* eslint-disable no-alert */
/* globals alert */
/**
 * External dependencies
 */
import { boolean, select } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { ItemGroup, Item } from '..';
import { Popover } from '../../popover';
import Button from '../../../button';

export default {
	component: ItemGroup,
	title: 'Components (Experimental)/ItemGroup',
};

export const _default = () => {
	const itemGroupProps = {
		bordered: boolean( 'ItemGroup: bordered', true ),
		size: select(
			'ItemGroup: size',
			[ 'small', 'medium', 'large' ],
			'medium'
		),
		separated: boolean( 'ItemGroup: separated', false ),
		rounded: boolean( 'ItemGroup: rounded', false ),
	};

	const itemProps = {
		size: select(
			'Item 1: size',
			[ 'small', 'medium', 'large' ],
			'medium'
		),
		action: boolean( 'Item 1: action', true ),
	};

	return (
		<ItemGroup style={ { width: '350px' } } { ...itemGroupProps }>
			<Item { ...itemProps } onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
		</ItemGroup>
	);
};

export const dropdown = () => (
	<Popover
		style={ { width: '350px' } }
		trigger={ <Button>Open Popover</Button> }
	>
		<ItemGroup style={ { padding: 4 } }>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
			<Item action onClick={ () => alert( 'WordPress.org' ) }>
				Code is Poetry — Click me!
			</Item>
		</ItemGroup>
	</Popover>
);
/* eslint-enable no-alert */
