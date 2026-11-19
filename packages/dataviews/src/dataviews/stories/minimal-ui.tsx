import type { ReactNode } from 'react';
import {
	useState,
	useMemo,
	useEffect,
	useLayoutEffect,
} from '@wordpress/element';
import { Dropdown } from '@wordpress/components';
import DataViews from '../index';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { Field, View } from '../../types';
import { data, fields, type SpaceObject } from './fixtures';
import { LAYOUT_TABLE } from '../../constants';

const twoLinesStyle = {
	display: '-webkit-box',
	WebkitBoxOrient: 'vertical',
	WebkitLineClamp: 2,
	overflow: 'hidden',
	// Undo the table cell's `nowrap`, which the text inherits.
	whiteSpace: 'normal',
	// Size the column as if the text were on one line, up to 40ch, so the
	// two lines are 40ch wide rather than the column's minimum width.
	width: 'max-content',
	maxWidth: '40ch',
} as const;

const triggerStyle = {
	display: 'block',
	padding: 0,
	border: 'none',
	background: 'none',
	color: 'inherit',
	font: 'inherit',
	textAlign: 'start',
	cursor: 'pointer',
} as const;

/**
 * A field render that shows two lines of text and, when the text does not
 * fit, opens the rest on click in a dropdown with the item's title. It
 * replaces the one-line value and hover popover that DataViews shows for
 * fields without their own render.
 */
function TwoLinesWithPopover( {
	title,
	children,
}: {
	title: string;
	children: ReactNode;
} ) {
	const [ element, setElement ] = useState< HTMLSpanElement | null >( null );
	const [ isClamped, setIsClamped ] = useState( false );

	useLayoutEffect( () => {
		if ( ! element ) {
			return;
		}
		const measure = () =>
			setIsClamped( element.scrollHeight > element.clientHeight );
		measure();
		const resizeObserver = new ResizeObserver( measure );
		resizeObserver.observe( element );
		return () => resizeObserver.disconnect();
	}, [ element, children ] );

	const text = (
		<span ref={ setElement } style={ twoLinesStyle }>
			{ children }
		</span>
	);

	if ( ! isClamped ) {
		return text;
	}

	return (
		<Dropdown
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<button
					type="button"
					style={ triggerStyle }
					aria-expanded={ isOpen }
					onClick={ onToggle }
				>
					{ text }
				</button>
			) }
			renderContent={ () => (
				<div style={ { width: '40ch' } }>
					<strong>{ title }</strong>
					<p>{ children }</p>
				</div>
			) }
		/>
	);
}

const summaryField: Field< SpaceObject > = {
	id: 'summary',
	label: 'Summary',
	type: 'text',
	getValue: ( { item } ) => item.name.description,
	render: ( { item } ) => (
		<TwoLinesWithPopover title={ item.name.title }>
			{ item.name.description }
		</TwoLinesWithPopover>
	),
};

const MinimalUIComponent = ( {
	layout = 'table',
}: {
	layout: 'table' | 'list' | 'grid';
} ) => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 10,
		layout: {
			enableMoving: false,
		},
		filters: [],
		fields: [ 'title', 'description', 'summary', 'categories' ],
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	const _fields: Field< SpaceObject >[] = [ ...fields, summaryField ].map(
		( field ) => ( {
			...field,
			enableSorting: false,
			enableHiding: false,
			filterBy: false,
		} )
	);

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			type: layout as any,
		} ) );
	}, [ layout ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ _fields }
			onChangeView={ setView }
			defaultLayouts={ { [ layout ]: true } }
		>
			<DataViews.Layout />
			<DataViews.Footer />
		</DataViews>
	);
};

export default MinimalUIComponent;
