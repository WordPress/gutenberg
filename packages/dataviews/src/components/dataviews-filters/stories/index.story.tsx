/**
 * Stress cases for the width of a filter popover. Each story renders the same
 * filters, opens the ones it checks, and measures the popover in its `play`
 * function, so the run fails when the layout breaks.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { useMemo, useState } from '@wordpress/element';
import DataViews from '../../../dataviews';
import filterSortAndPaginate from '../../../utils/filter-sort-and-paginate';
import type { DataFormControlProps, Field, View } from '../../../types';

type Item = {
	id: number;
	title: string;
	subtitle: string;
	shortName: string;
	longName: string;
	tags: string;
	badge: string;
	status: string;
};

const data: Item[] = [
	{
		id: 1,
		title: 'Moon',
		subtitle: 'Satellite',
		shortName: 'a',
		longName: 'a',
		tags: 'Token 1',
		badge: 'Token 1',
		status: 'published',
	},
];

const TEXT_OPERATORS = [ 'is', 'isNot' ] as const;

// A control whose items wrap, like a token list. Laid out at `max-content`,
// it puts every item on one row.
function WrappingControl( { onChange, field }: DataFormControlProps< Item > ) {
	return (
		<div
			className="wrapping-control"
			style={ { display: 'flex', flexWrap: 'wrap', gap: 4 } }
		>
			{ Array.from( { length: 30 }, ( _, index ) => (
				<button
					key={ index }
					type="button"
					onClick={ () =>
						onChange( { [ field.id ]: `Token ${ index }` } )
					}
				>
					{ `Token ${ index }` }
				</button>
			) ) }
		</div>
	);
}

// A control wider than the 250px the popover used to allow, which must not be
// clipped or overflow.
function FixedWidthControl() {
	return (
		<div
			className="fixed-width-control"
			style={ { width: 320, height: 40, background: '#ddd' } }
		/>
	);
}

const fields: Field< Item >[] = [
	{
		id: 'title',
		label: 'Title',
		type: 'text',
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	{
		id: 'subtitle',
		label: 'Subtitle',
		type: 'text',
		description:
			'The text shown under the title, in the language configured in the site settings.',
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	{
		id: 'shortName',
		label: 'Name',
		type: 'text',
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	{
		id: 'longName',
		label: 'Date of the last modification of the content',
		type: 'text',
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	{
		id: 'tags',
		label: 'Tags',
		type: 'text',
		Edit: WrappingControl,
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	{
		id: 'badge',
		label: 'Badge',
		type: 'text',
		Edit: FixedWidthControl,
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	{
		id: 'status',
		label: 'Status',
		elements: [
			{ value: 'published', label: 'Published' },
			{ value: 'draft', label: 'Draft' },
		],
		filterBy: { isPrimary: true },
	},
];

const FilterPopoverComponent = () => {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		search: '',
		page: 1,
		perPage: 10,
		layout: {},
		// An input filter renders its control only once the view has it.
		filters: fields
			.filter( ( field ) => ! field.elements )
			.map( ( field ) => ( {
				field: field.id,
				operator: 'is',
				value: undefined,
			} ) ),
		fields: [ 'title' ],
	} );
	const { data: shownData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( data, view, fields ),
		[ view ]
	);
	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			defaultLayouts={ { table: {} } }
		/>
	);
};

const meta: Meta< typeof FilterPopoverComponent > = {
	// The `dataviews-` prefix loads the package styles.
	id: 'dataviews-dataviews-filter-popover',
	title: 'Design System/DataViews/DataViews/Filter Popover',
	component: FilterPopoverComponent,
	tags: [ '!autodocs' ],
	parameters: {
		layout: 'fullscreen',
		controls: { disable: true },
		// Each story leaves its popover open to inspect. The popover is a
		// dialog with no accessible name, which axe reports: warn instead of
		// failing, as it is unrelated to the width checked here.
		a11y: { test: 'todo' },
	},
};
export default meta;

type Story = StoryObj< typeof FilterPopoverComponent >;

const nextFrame = () =>
	new Promise( ( resolve ) => requestAnimationFrame( resolve ) );

/**
 * Opens the filter whose chip starts with `name`, and returns its popover
 * content once it is placed.
 *
 * @param canvasElement The story root.
 * @param name          The filter name.
 */
async function openFilter( canvasElement: HTMLElement, name: string ) {
	const chip = Array.from(
		canvasElement.querySelectorAll< HTMLElement >(
			'.dataviews-filters__summary-chip'
		)
	).find( ( element ) => element.textContent?.trim().startsWith( name ) );
	if ( ! chip ) {
		throw new Error( `No filter chip named "${ name }".` );
	}
	await userEvent.click( chip );
	let content: HTMLElement | null = null;
	await waitFor( () => {
		content = document.querySelector(
			'.dataviews-filters__summary-popover .components-popover__content'
		);
		expect( content ).toBeVisible();
	} );
	// Let the popover settle on its final size and position.
	await nextFrame();
	await nextFrame();
	return content as unknown as HTMLElement;
}

async function closeFilter() {
	await userEvent.keyboard( '{Escape}' );
	await waitFor( () =>
		expect(
			document.querySelector( '.dataviews-filters__summary-popover' )
		).toBeNull()
	);
}

async function widthOf( canvasElement: HTMLElement, name: string ) {
	const content = await openFilter( canvasElement, name );
	const { width } = content.getBoundingClientRect();
	await closeFilter();
	return width;
}

function expectInsideViewport( element: HTMLElement ) {
	const { left, right } = element.getBoundingClientRect();
	expect( left ).toBeGreaterThanOrEqual( 0 );
	expect( right ).toBeLessThanOrEqual( document.documentElement.clientWidth );
}

/**
 * A field's description shows as help text under the control. It should wrap
 * to the control's width, not make the popover wider.
 */
export const HelpText: Story = {
	play: async ( { canvasElement } ) => {
		const withoutHelp = await widthOf( canvasElement, 'Title' );
		const withHelp = await widthOf( canvasElement, 'Subtitle' );
		expect( withHelp ).toBe( withoutHelp );
	},
};

/**
 * A long filter name, as in a translation, should be truncated rather than
 * make the popover wider.
 */
export const LongFilterName: Story = {
	play: async ( { canvasElement } ) => {
		const shortName = await widthOf( canvasElement, 'Name' );
		const longName = await widthOf( canvasElement, 'Date of' );
		expect( longName ).toBe( shortName );
		// The name is still shown: its text gets some room, not just the
		// name's padding.
		const content = await openFilter( canvasElement, 'Date of' );
		const name = content.querySelector< HTMLElement >(
			'.dataviews-filters__summary-operators-filter-name'
		);
		if ( ! name ) {
			throw new Error( 'No filter name in the popover.' );
		}
		const { paddingLeft, paddingRight } = getComputedStyle( name );
		const textWidth =
			name.clientWidth -
			parseFloat( paddingLeft ) -
			parseFloat( paddingRight );
		expect( textWidth ).toBeGreaterThan( 0 );
		await closeFilter();
	},
};

/**
 * A control whose items wrap must stay inside the viewport, wrapping its
 * items instead.
 */
export const WrappingCustomControl: Story = {
	play: async ( { canvasElement } ) => {
		const content = await openFilter( canvasElement, 'Tags' );
		expectInsideViewport( content );
		expect( document.documentElement.scrollWidth ).toBeLessThanOrEqual(
			document.documentElement.clientWidth
		);
	},
};

/**
 * A fixed-width control wider than 250px must fit in the popover: it grows
 * to hold it instead of letting it overflow.
 */
export const FixedWidthCustomControl: Story = {
	play: async ( { canvasElement } ) => {
		const content = await openFilter( canvasElement, 'Badge' );
		const control = content.querySelector(
			'.fixed-width-control'
		) as HTMLElement;
		expect( content.getBoundingClientRect().right ).toBeGreaterThanOrEqual(
			control.getBoundingClientRect().right
		);
		expectInsideViewport( content );
	},
};

/**
 * A list filter keeps the default width.
 */
export const ListFilter: Story = {
	play: async ( { canvasElement } ) => {
		const content = await openFilter( canvasElement, 'Status' );
		const { width } = content.getBoundingClientRect();
		expect( width ).toBeGreaterThanOrEqual( 230 );
		expect( width ).toBeLessThanOrEqual( 250 );
	},
};
