/* eslint-disable no-alert */
/* globals alert */
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

export const _default = () => (
	<ItemGroup css={ { width: '350px' } } bordered>
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
);

export const dropdown = () => (
	<Flyout
		css={ { width: '350px' } }
		trigger={ <Button>Open Popover</Button> }
	>
		<ItemGroup css={ { padding: 4 } }>
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
	</Flyout>
);
/* eslint-enable no-alert */
