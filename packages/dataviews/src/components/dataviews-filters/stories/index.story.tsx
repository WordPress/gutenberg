/**
 * Filters that stress the width of a filter popover: help text, a long name,
 * and custom controls that wrap or have a fixed width. Open each one to check
 * the popover fits its content.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
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
	},
};
export default meta;

type Story = StoryObj< typeof FilterPopoverComponent >;

export const FilterPopover: Story = {};
