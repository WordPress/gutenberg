import { render } from 'vitest-browser-react';
import { expect, it } from 'vitest';
import '@wordpress/theme/design-tokens.css';
import '@wordpress/components/src/button/style.scss';
import DataViews from '../index';
import type { Action, Field, View } from '../../types';
import '../../style.scss';

type Moon = {
	id: string;
	title: string;
	description: string;
};

const moons: Moon[] = [
	{ id: '1', title: 'Io', description: 'A moon of fire' },
	{ id: '2', title: 'Rhea', description: 'A moon of ice' },
];

const fields: Field< Moon >[] = [
	{ id: 'title', label: 'Title', type: 'text' },
	{ id: 'description', label: 'Description', type: 'text' },
];

const actions: Action< Moon >[] = [
	{ id: 'edit', label: 'Edit', isPrimary: true, callback: () => {} },
	{ id: 'trash', label: 'Trash', callback: () => {} },
];

function MoonsTable( { descriptionField }: { descriptionField?: string } ) {
	const view: View = {
		type: 'table',
		titleField: 'title',
		descriptionField,
		fields: [],
		page: 1,
		perPage: 10,
	};
	return (
		<div style={ { width: 190, height: 400 } }>
			<DataViews
				data={ moons }
				fields={ fields }
				view={ view }
				onChangeView={ () => {} }
				actions={ actions }
				paginationInfo={ { totalItems: 2, totalPages: 1 } }
				defaultLayouts={ { table: true } }
			/>
		</div>
	);
}

const getScrollContainer = () =>
	document.querySelector< HTMLElement >( '.dataviews-layout__container' )!;

it( 'fits short titles in a container that their 15ch floor would overflow', async () => {
	const screen = await render( <MoonsTable /> );
	await expect.element( screen.getByText( 'Rhea' ) ).toBeVisible();

	const container = getScrollContainer();
	expect( container.scrollWidth ).toBe( container.clientWidth );
} );

it( 'keeps the floor when the column also shows a description', async () => {
	const screen = await render(
		<MoonsTable descriptionField="description" />
	);
	await expect.element( screen.getByText( 'Rhea' ) ).toBeVisible();

	const container = getScrollContainer();
	expect( container.scrollWidth ).toBeGreaterThan( container.clientWidth );
} );
