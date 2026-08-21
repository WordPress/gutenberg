import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getBlockBindingsSource } from '@wordpress/blocks';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import BlockBindingsAttributeControl from '../attribute-control';
import useBlockBindingsUtils from '../use-block-bindings-utils';

jest.mock( '@wordpress/blocks', () => ( {
	...jest.requireActual( '@wordpress/blocks' ),
	getBlockBindingsSource: jest.fn(),
} ) );
jest.mock( '@wordpress/components', () => ( {
	...jest.requireActual( '@wordpress/components' ),
	__experimentalToolsPanelItem: ( { children } ) => children,
} ) );
jest.mock( '@wordpress/compose/src/hooks/use-viewport-match', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '../use-block-bindings-utils', () => jest.fn() );

const updateBlockBindings = jest.fn();
const field = {
	args: { key: 'seo_title' },
	key: 'seo_title',
	label: 'A deliberately long SEO title field',
	type: 'string',
};
const source = {
	getValues: jest.fn(),
	label: 'Post meta',
};

function renderControl( binding ) {
	useViewportMatch.mockReturnValue( false );
	getBlockBindingsSource.mockReturnValue( source );
	useBlockBindingsUtils.mockReturnValue( { updateBlockBindings } );
	useSelect.mockImplementation( ( _mapSelect, dependencies ) => {
		if ( dependencies?.length === 3 ) {
			return { 'core/post-meta': [ field ] };
		}
		if ( dependencies?.length === 4 ) {
			return { content: 'A value supplied by post meta' };
		}
		return { canUpdateBlockBindings: true };
	} );

	return render(
		<BlockBindingsAttributeControl
			attribute="content"
			binding={ binding }
			blockName="core/paragraph"
		/>
	);
}

async function openFieldMenu() {
	fireEvent.click( screen.getByRole( 'button', { name: /content/i } ) );
	const sourceItem = await screen.findByRole( 'menuitem', {
		name: 'Post meta',
	} );
	fireEvent.click( sourceItem );
	return screen.findByRole( 'menuitemcheckbox', {
		name: 'A deliberately long SEO title field',
	} );
}

describe( 'BlockBindingsAttributeControl', () => {
	beforeEach( () => {
		updateBlockBindings.mockReset();
	} );

	it( 'selects a source field and keeps its menu open', async () => {
		const user = userEvent.setup();
		renderControl();

		const fieldItem = await openFieldMenu();
		expect( fieldItem ).not.toBeChecked();
		expect( fieldItem ).toHaveAccessibleDescription(
			'A value supplied by post meta'
		);

		await user.click( fieldItem );

		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: {
				source: 'core/post-meta',
				args: field.args,
			},
		} );
		expect( fieldItem ).toBeVisible();
	} );

	it( 'clears the selected source field and keeps its menu open', async () => {
		const user = userEvent.setup();
		renderControl( {
			source: 'core/post-meta',
			args: field.args,
		} );

		const fieldItem = await openFieldMenu();
		expect( fieldItem ).toBeChecked();

		await user.click( fieldItem );

		expect( updateBlockBindings ).toHaveBeenCalledWith( {
			content: undefined,
		} );
		expect( fieldItem ).toBeVisible();
	} );
} );
