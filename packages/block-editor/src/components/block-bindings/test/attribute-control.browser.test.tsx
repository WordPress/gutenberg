import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import {
	registerBlockBindingsSource,
	unregisterBlockBindingsSource,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import type { Mock } from 'vitest';
import useBlockBindingsUtils from '../use-block-bindings-utils';
import BlockBindingsAttributeControl from '../attribute-control';
import type { Binding } from '../../../utils/block-bindings';

vi.mock( import( '@wordpress/data' ), { spy: true } );

vi.mock( import( '../use-block-bindings-utils' ), () => ( {
	default: vi.fn(),
} ) );

const updateBlockBindings = vi.fn();
const field = {
	args: { key: 'seo_title' },
	key: 'seo_title',
	label: 'SEO title',
	type: 'string',
};
const source = {
	name: 'test/post-meta',
	getValues: () => ( {} ),
	getFieldsList: () => [ field ],
	label: 'Post meta',
};

async function renderControl( binding?: Binding ) {
	vi.mocked( useSelect ).mockImplementation(
		( _mapSelect: unknown, dependencies?: unknown[] ) => {
			if ( dependencies?.length === 3 ) {
				return { [ source.name ]: [ field ] };
			}
			if ( dependencies?.length === 4 ) {
				return {};
			}
			return { canUpdateBlockBindings: true };
		}
	);
	( useBlockBindingsUtils as Mock ).mockReturnValue( {
		updateBlockBindings,
	} );

	await render(
		<ToolsPanel label="Attributes" resetAll={ () => {} }>
			<BlockBindingsAttributeControl
				attribute="content"
				binding={ binding }
				blockName="test/bindable"
			/>
		</ToolsPanel>
	);
	if ( ! binding ) {
		await userEvent.click(
			page.getByRole( 'button', { name: /Attributes.*options/i } )
		);
		await userEvent.click(
			page.getByRole( 'menuitemcheckbox', { name: 'content, show' } )
		);
		await userEvent.keyboard( '{Escape}' );
	}
}

async function openFieldMenu( user: ReturnType< typeof userEvent.setup > ) {
	await user.click( page.getByRole( 'button', { name: /content/i } ) );
	await user.click( page.getByRole( 'menuitem', { name: 'Post meta' } ) );
	return page.getByRole( 'menuitemcheckbox', { name: 'SEO title' } );
}

describe( 'BlockBindingsAttributeControl', () => {
	beforeEach( () => {
		updateBlockBindings.mockReset();
		registerBlockBindingsSource( source );
	} );

	afterEach( async () => {
		await cleanup();
		unregisterBlockBindingsSource( source.name );
	} );

	it( 'selects a source field', async () => {
		const user = userEvent.setup();
		await renderControl();

		const fieldItem = await openFieldMenu( user );
		await user.click( fieldItem );

		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: {
				source: 'test/post-meta',
				args: field.args,
			},
		} );
	} );

	it( 'clears the selected source field', async () => {
		const user = userEvent.setup();
		await renderControl( {
			source: 'test/post-meta',
			args: field.args,
		} );

		const fieldItem = await openFieldMenu( user );
		await user.click( fieldItem );

		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: undefined,
		} );
	} );
} );
