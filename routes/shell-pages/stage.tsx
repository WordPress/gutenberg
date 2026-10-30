import { Page } from '@wordpress/admin-ui';
import { privateApis as bootPrivateApis } from '@wordpress/boot';
import { useEntityRecords } from '@wordpress/core-data';
import type { Post } from '@wordpress/core-data';
import { DataViews } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import { dateI18n, getSettings } from '@wordpress/date';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';
import { Link, useNavigate } from '@wordpress/route';
// The site shell is a prototype built on `@wordpress/ui` throughout.
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Button,
} from '@wordpress/ui';
import styles from './style.module.scss';

const STATUSES = [
	{ value: 'publish', label: __( 'Published' ) },
	{ value: 'draft', label: __( 'Draft' ) },
	{ value: 'pending', label: __( 'Pending' ) },
	{ value: 'private', label: __( 'Private' ) },
	{ value: 'future', label: __( 'Scheduled' ) },
];

const FIELDS: Field< Post >[] = [
	{
		id: 'title',
		label: __( 'Title' ),
		getValue: ( { item } ) =>
			decodeEntities( item.title?.rendered ?? '' ) || __( '(no title)' ),
		enableHiding: false,
		enableGlobalSearch: true,
	},
	{
		id: 'status',
		label: __( 'Status' ),
		elements: STATUSES,
		filterBy: { operators: [ 'isAny' ] },
		enableSorting: false,
	},
	{
		id: 'date',
		label: __( 'Date' ),
		type: 'datetime',
		render: ( { item } ) =>
			dateI18n( getSettings().formats.date, item.date ?? '' ),
	},
];

const DEFAULT_LAYOUTS = { table: {} };

// Shows the screen's actions beside its title in the site shell's bar.
const { ShellPageActions } = unlock( bootPrivateApis );

/**
 * A simple list of the site's pages. Clicking a page opens it in the editor.
 * The site shell names the screen in its bar, so the screen has no header.
 *
 * @return The pages screen.
 */
function PagesStage() {
	const navigate = useNavigate();
	const [ view, setView ] = useState< View >( {
		type: 'table',
		perPage: 20,
		page: 1,
		search: '',
		sort: { field: 'date', direction: 'desc' },
		filters: [],
		titleField: 'title',
		fields: [ 'status', 'date' ],
	} );

	const query = useMemo( () => {
		const status = view.filters?.find(
			( filter ) => filter.field === 'status'
		)?.value;
		return {
			per_page: view.perPage,
			page: view.page,
			search: view.search || undefined,
			orderby: view.sort?.field,
			order: view.sort?.direction,
			status: status?.length
				? status
				: STATUSES.map( ( { value } ) => value ),
			context: 'edit',
		};
	}, [ view ] );

	const { records, isResolving, totalItems, totalPages } =
		useEntityRecords< Post >( 'postType', 'page', query );

	return (
		<Page
			ariaLabel={ __( 'Pages' ) }
			hasPadding={ false }
			className={ styles.page }
		>
			<ShellPageActions>
				<Button
					variant="outline"
					tone="neutral"
					size="compact"
					// The title beside it says what it adds. Out of that
					// context, it says so itself.
					aria-label={ __( 'Add page' ) }
					onClick={ () => navigate( { to: '/types/page/new' } ) }
				>
					{ __( 'Add' ) }
				</Button>
			</ShellPageActions>
			<DataViews< Post >
				data={ records ?? [] }
				fields={ FIELDS }
				view={ view }
				onChangeView={ setView }
				isLoading={ isResolving }
				paginationInfo={ {
					totalItems: totalItems ?? 0,
					totalPages: totalPages ?? 0,
				} }
				defaultLayouts={ DEFAULT_LAYOUTS }
				getItemId={ ( item ) => item.id.toString() }
				isItemClickable={ () => true }
				renderItemLink={ ( { item, ...props } ) => (
					<Link to={ `/types/page/edit/${ item.id }` } { ...props } />
				) }
			/>
		</Page>
	);
}

export const stage = PagesStage;
