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
	withoutHelpText: string;
	withHelpText: string;
	shortName: string;
	longName: string;
	customEditWrapping: string;
	customEditFixedWidth: string;
	elements: string;
};

const data: Item[] = [
	{
		id: 1,
		withoutHelpText: 'Moon',
		withHelpText: 'Satellite',
		shortName: 'a',
		longName: 'a',
		customEditWrapping: 'Token 1',
		customEditFixedWidth: 'Token 1',
		elements: 'published',
	},
];

const TEXT_OPERATORS = [ 'is', 'isNot' ] as const;

// A control whose items wrap, like a token list. Laid out at `max-content`,
// it puts every item on one row.
function WrappingEdit( { onChange, field }: DataFormControlProps< Item > ) {
	return (
		<div style={ { display: 'flex', flexWrap: 'wrap', gap: 4 } }>
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
function FixedWidthEdit() {
	return <div style={ { width: 320, height: 40, background: '#ddd' } } />;
}

// Each pair shows a case next to the one it is compared with. The chips sort
// by label, so a pair shares a label prefix to stay together.
const fields: Field< Item >[] = [
	// Help text should wrap to the control's width, not widen the popover.
	{
		id: 'withoutHelpText',
		label: 'Help text: none',
		type: 'text',
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	{
		id: 'withHelpText',
		label: 'Help text: long',
		type: 'text',
		description:
			'The text shown under the title, in the language configured in the site settings.',
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	// A long name, as in a translation, should be truncated on one line, not
	// widen the popover or squeeze the operator.
	{
		id: 'shortName',
		label: 'Name: short',
		type: 'text',
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	{
		id: 'longName',
		label: 'Name: long, as a translation that does not fit on one line',
		type: 'text',
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	// A custom control should fit: wrapping its items inside the viewport, or
	// growing the popover to hold a fixed width.
	{
		id: 'customEditWrapping',
		label: 'Custom edit: wrapping',
		type: 'text',
		Edit: WrappingEdit,
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	{
		id: 'customEditFixedWidth',
		label: 'Custom edit: fixed width',
		type: 'text',
		Edit: FixedWidthEdit,
		filterBy: { isPrimary: true, operators: [ ...TEXT_OPERATORS ] },
	},
	// A field with elements gets a list popover, which keeps the default width:
	// a long element label is truncated, with the full label in a tooltip.
	{
		id: 'elements',
		label: 'Elements',
		elements: [
			{ value: 'published', label: 'Published' },
			{ value: 'draft', label: 'Draft' },
			{
				value: 'pending',
				label: 'Pending review by an editor before it can be published on the site',
			},
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
		fields: [ 'withoutHelpText' ],
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
