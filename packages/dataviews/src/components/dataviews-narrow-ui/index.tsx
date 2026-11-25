import { Stack } from '@wordpress/ui';
import DataViewsFilterTabs from '../dataviews-filter-tabs';
import DataViewsFooter from '../dataviews-footer';
import DataViewsLayout from '../dataviews-layout';
import DataViewsSearch from '../dataviews-search';
import DataViewsViewMenu from '../dataviews-view-menu';

interface NarrowUIProps {
	search?: boolean;
	searchLabel?: string;
	tabsField?: string;
	showSort?: boolean;
}

/**
 * The UI for narrow, single-purpose containers such as a sidebar, rendered in
 * place of the default UI when the `narrow` prop is set. It takes the same
 * data, fields and view, in an opinionated layout with a single settings button
 * in place of the filters and the view options buttons.
 *
 * The rows, from top to bottom: search and the settings button; optionally one
 * field as tabs; the content; the footer.
 */
export default function NarrowUI( {
	search = true,
	searchLabel,
	tabsField,
	showSort = true,
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
		</>
	);
}
