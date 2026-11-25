import type { ReactNode } from 'react';
import { Stack } from '@wordpress/ui';
import DataViewsFilterTabs from '../dataviews-filter-tabs';
import DataViewsFooter from '../dataviews-footer';
import DataViewsLayout from '../dataviews-layout';
import DataViewsSearch from '../dataviews-search';
import DataViewsViewMenu from '../dataviews-view-menu';

export interface NarrowUIProps {
	/**
	 * Whether the search input is shown.
	 *
	 * @default true
	 */
	search?: boolean;

	/**
	 * The label of the search input.
	 */
	searchLabel?: string;

	/**
	 * The id of a field to show as tabs above the content: the main way to
	 * browse it, such as a category or a type. That field is left out of the
	 * settings menu.
	 */
	tabsField?: string;

	/**
	 * Whether the settings menu offers sorting.
	 *
	 * @default false
	 */
	showSort?: boolean;

	/**
	 * Content for the last row, below the pagination. For example, a button
	 * that leads to the full view.
	 */
	footer?: ReactNode;
}

/**
 * A ready-made UI for narrow, single-purpose containers such as a sidebar. It
 * is an alternative to the default UI: the same data, fields and view, in an
 * opinionated layout with a single settings button in place of the filters and
 * the view options buttons.
 *
 * The rows, from top to bottom: search and the settings button; optionally one
 * field as tabs; the content; the footer.
 */
export default function DataViewsNarrowUI( {
	search = true,
	searchLabel,
	tabsField,
	showSort = false,
	footer,
}: NarrowUIProps ) {
	return (
		<>
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				gap="xs"
				className="dataviews__view-actions dataviews-narrow-ui__actions"
			>
				<Stack
					direction="row"
					justify="start"
					className="dataviews__search"
				>
					{ search && <DataViewsSearch label={ searchLabel } /> }
				</Stack>
				<DataViewsViewMenu
					excludeFields={ tabsField ? [ tabsField ] : undefined }
					showSort={ showSort }
				/>
			</Stack>
			{ tabsField ? (
				<DataViewsFilterTabs field={ tabsField } />
			) : (
				<DataViewsLayout />
			) }
			<DataViewsFooter />
			{ footer && (
				<div className="dataviews-narrow-ui__footer">{ footer }</div>
			) }
		</>
	);
}
