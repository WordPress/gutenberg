import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import {
	getBlockBindingsSource,
	registerBlockBindingsSource,
	unregisterBlockBindingsSource,
} from '@wordpress/blocks';
import { select } from '@wordpress/data';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Test the Menu used by the binding picker.
	Menu,
} from '@wordpress/ui';
import BlockBindingsSourceFieldsList from '../source-fields-list';
import type { BlockBindingsField } from '../types';
import type { Binding } from '../../../utils/block-bindings';

const { updateBlockBindings } = vi.hoisted( () => ( {
	updateBlockBindings: vi.fn(),
} ) );

vi.mock( import( '../use-block-bindings-utils' ), () => ( {
	default: () => ( { updateBlockBindings, removeAllBlockBindings: vi.fn() } ),
} ) );

const sourceName = 'test/custom-fields';
const legacyFields = [
	{ key: 'title', label: 'Title', type: 'string' },
	{ key: 'summary', label: 'Summary', type: 'string' },
];
const explicitFields = [
	{
		key: 'shared',
		args: { key: 'shared', scope: 'title' },
		label: 'Title',
		type: 'string',
	},
	{
		key: 'shared',
		args: { key: 'shared', scope: 'summary' },
		label: 'Summary',
		type: 'string',
	},
];
let fields: BlockBindingsField[];

async function openPicker( args?: Binding[ 'args' ] ) {
	const source = getBlockBindingsSource( sourceName )!;
	const sourceFields = source.getFieldsList!( {
		select,
		context: {},
	} ) as BlockBindingsField[];
	await render(
		<Menu.Root>
			<Menu.Trigger>Connect content</Menu.Trigger>
			<Menu.Popup>
				<BlockBindingsSourceFieldsList
					attribute="content"
					args={ args }
					sourceKey={ sourceName }
					fields={ sourceFields }
				/>
			</Menu.Popup>
		</Menu.Root>
	);
	await userEvent.click(
		page.getByRole( 'button', { name: 'Connect content' } )
	);
	await userEvent.click(
		page.getByRole( 'menuitem', { name: 'Custom fields' } )
	);
	await expect
		.element( page.getByRole( 'menuitemcheckbox', { name: /Title/ } ) )
		.toBeVisible();
}

describe( 'BlockBindingsSourceFieldsList', () => {
	beforeEach( () => {
		fields = legacyFields;
		updateBlockBindings.mockClear();
		registerBlockBindingsSource( {
			name: sourceName,
			label: 'Custom fields',
			getFieldsList: () => fields,
			getValues: ( {
				bindings,
			}: {
				bindings: Record< string, Binding >;
			} ) => ( {
				content:
					bindings.content.args?.scope || bindings.content.args?.key,
			} ),
		} );
	} );

	afterEach( async () => {
		await cleanup();
		unregisterBlockBindingsSource( sourceName );
	} );

	it( 'marks only the connected legacy field as selected', async () => {
		await openPicker( { key: 'title' } );
		await expect
			.element( page.getByRole( 'menuitemcheckbox', { name: /Title/ } ) )
			.toHaveAttribute( 'aria-checked', 'true' );
		await expect
			.element(
				page.getByRole( 'menuitemcheckbox', { name: /Summary/ } )
			)
			.toHaveAttribute( 'aria-checked', 'false' );
	} );

	it( 'leaves legacy fields unselected when there is no binding', async () => {
		await openPicker();
		await expect
			.element( page.getByRole( 'menuitemcheckbox', { name: /Title/ } ) )
			.toHaveAttribute( 'aria-checked', 'false' );
		await expect
			.element(
				page.getByRole( 'menuitemcheckbox', { name: /Summary/ } )
			)
			.toHaveAttribute( 'aria-checked', 'false' );
	} );

	it( 'connects a legacy field using its key argument', async () => {
		await openPicker();
		await userEvent.click(
			page.getByRole( 'menuitemcheckbox', { name: /Title/ } )
		);
		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: { source: sourceName, args: { key: 'title' } },
		} );
	} );

	it( 'disconnects a selected legacy field', async () => {
		await openPicker( { key: 'title' } );
		await userEvent.click(
			page.getByRole( 'menuitemcheckbox', { name: /Title/ } )
		);
		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: undefined,
		} );
	} );

	it( 'matches all explicit arguments even when legacy keys are shared', async () => {
		fields = explicitFields;
		await openPicker( explicitFields[ 0 ].args );
		await expect
			.element( page.getByRole( 'menuitemcheckbox', { name: /Title/ } ) )
			.toHaveAttribute( 'aria-checked', 'true' );
		await expect
			.element(
				page.getByRole( 'menuitemcheckbox', { name: /Summary/ } )
			)
			.toHaveAttribute( 'aria-checked', 'false' );
		await userEvent.click(
			page.getByRole( 'menuitemcheckbox', { name: /Summary/ } )
		);
		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: { source: sourceName, args: explicitFields[ 1 ].args },
		} );
	} );

	it( 'connects explicit arguments from an unbound attribute', async () => {
		fields = explicitFields;
		await openPicker();
		await expect
			.element( page.getByRole( 'menuitemcheckbox', { name: /Title/ } ) )
			.toHaveAttribute( 'aria-checked', 'false' );
		await userEvent.click(
			page.getByRole( 'menuitemcheckbox', { name: /Title/ } )
		);
		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: { source: sourceName, args: explicitFields[ 0 ].args },
		} );
	} );
} );
