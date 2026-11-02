/**
 * A page that is heavy on purpose, to test how many pages the admin shell
 * can keep in memory. It shows a DataViews table over a few thousand
 * generated items, like a real list page, and holds an adjustable amount of
 * extra data in memory.
 */
import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import {
	DataViews,
	filterSortAndPaginate,
	type Field,
	type View,
} from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { InputControl, Stack, Text } from '@wordpress/ui';
import { getHeavyPageTitle } from './page-title';

const ITEM_COUNT = 2000;
const DEFAULT_MEGABYTES = 50;
// Doubles in one megabyte of a packed JavaScript array.
const DOUBLES_PER_MEGABYTE = ( 1024 * 1024 ) / 8;

interface Item {
	id: number;
	title: string;
	author: string;
	status: string;
	date: string;
	words: number;
	excerpt: string;
}

const AUTHORS = [ 'Ana', 'Ben', 'Chen', 'Dara', 'Eli', 'Femi', 'Gus' ];
const STATUSES = [ 'publish', 'draft', 'pending', 'private' ];
const WORDS =
	'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(
		' '
	);

function makeItems( count: number ): Item[] {
	return Array.from( { length: count }, ( _, index ) => {
		const words = Array.from(
			{ length: 30 },
			( __unused, word ) =>
				WORDS[ ( index * 7 + word * 3 ) % WORDS.length ]
		);
		return {
			id: index + 1,
			title: `${ words.slice( 0, 4 ).join( ' ' ) } ${ index + 1 }`,
			author: AUTHORS[ index % AUTHORS.length ],
			status: STATUSES[ index % STATUSES.length ],
			date: new Date( Date.UTC( 2026, 0, 1 ) + index * 3600000 )
				.toISOString()
				.slice( 0, 10 ),
			words: 200 + ( ( index * 37 ) % 1800 ),
			excerpt: words.join( ' ' ),
		};
	} );
}

/**
 * Holds about `megabytes` MB on the JavaScript heap, as packed arrays of
 * numbers, which the page keeps for as long as it is mounted.
 *
 * @param megabytes Megabytes to hold.
 */
function makeBallast( megabytes: number ) {
	return Array.from( { length: megabytes }, ( _, chunk ) =>
		Array.from(
			{ length: DOUBLES_PER_MEGABYTE },
			( __unused, index ) => chunk + index + 0.5
		)
	);
}

const fields: Field< Item >[] = [
	{ id: 'title', label: __( 'Title' ), enableHiding: false },
	{
		id: 'author',
		label: __( 'Author' ),
		elements: AUTHORS.map( ( value ) => ( { value, label: value } ) ),
		filterBy: { operators: [ 'isAny' ] },
	},
	{
		id: 'status',
		label: __( 'Status' ),
		elements: STATUSES.map( ( value ) => ( { value, label: value } ) ),
		filterBy: { operators: [ 'isAny' ] },
	},
	{ id: 'date', label: __( 'Date' ), type: 'date' },
	{ id: 'words', label: __( 'Words' ), type: 'integer' },
	{ id: 'excerpt', label: __( 'Excerpt' ), enableSorting: false },
];

function Stage() {
	// Read while the page's own URL is showing, when it mounts.
	const [ title ] = useState( getHeavyPageTitle );
	const items = useMemo( () => makeItems( ITEM_COUNT ), [] );
	const [ megabytes, setMegabytes ] = useState( DEFAULT_MEGABYTES );
	const [ draftMegabytes, setDraftMegabytes ] = useState(
		String( DEFAULT_MEGABYTES )
	);
	const ballast = useMemo( () => makeBallast( megabytes ), [ megabytes ] );
	const [ view, setView ] = useState< View >( {
		type: 'table',
		page: 1,
		perPage: 100,
		titleField: 'title',
		fields: [ 'author', 'status', 'date', 'words', 'excerpt' ],
		sort: { field: 'date', direction: 'desc' },
	} );
	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( items, view, fields ),
		[ items, view ]
	);

	return (
		<Page
			title={ title }
			subTitle={ sprintf(
				/* translators: 1: number of list items, 2: megabytes. */
				__(
					'A list of %1$d items, plus %2$d MB of extra data held in memory, to test how many pages the admin shell can keep alive.'
				),
				ITEM_COUNT,
				ballast.length
			) }
			hasPadding
		>
			<Stack direction="column" gap="lg">
				<Stack direction="row" gap="md" align="end">
					<InputControl
						label={ __( 'Extra data to hold (MB)' ) }
						type="number"
						min={ 0 }
						value={ draftMegabytes }
						onChange={ ( event ) =>
							setDraftMegabytes( event.target.value )
						}
					/>
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ () =>
							setMegabytes(
								Math.max(
									0,
									parseInt( draftMegabytes, 10 ) || 0
								)
							)
						}
					>
						{ __( 'Apply' ) }
					</Button>
				</Stack>
				<Text>
					{ sprintf(
						/* translators: %d: megabytes. */
						__( 'Holding %d MB of extra data.' ),
						ballast.length
					) }
				</Text>
				<DataViews
					data={ data }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					paginationInfo={ paginationInfo }
					defaultLayouts={ { table: {} } }
					getItemId={ ( item ) => String( item.id ) }
				/>
			</Stack>
		</Page>
	);
}

export const stage = Stage;
