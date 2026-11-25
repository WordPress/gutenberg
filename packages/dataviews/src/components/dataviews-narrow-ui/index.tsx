import type { ReactNode } from 'react';
import { Stack } from '@wordpress/ui';
import type { NarrowOptions } from '../../types';
import DataViewsFilterTabs from '../dataviews-filter-tabs';
import DataViewsLayout from '../dataviews-layout';
import DataViewsSearch from '../dataviews-search';
import DataViewsViewMenu from '../dataviews-view-menu';

interface NarrowUIProps extends NarrowOptions {
	search?: boolean;
	searchLabel?: string;
	footer: ReactNode;
}

/**
 * Reads the `narrow` option of a grid layout.
 *
 * @param narrow The value of the option.
 * @return The options of the narrow UI, or `undefined` when it is off.
 */
export function getNarrowOptions(
	narrow: boolean | NarrowOptions | undefined
): NarrowOptions | undefined {
	if ( ! narrow ) {
		return undefined;
	}
	return narrow === true ? {} : narrow;
}

/**
 * The UI for narrow, single-purpose containers such as a sidebar, rendered in
 * place of the default UI when the grid layout has the `narrow` option. It
 * takes the same data, fields and view, in an opinionated layout with a single
 * settings button in place of the filters and the view options buttons.
 *
 * The rows, from top to bottom: search and the settings button; optionally one
 * field as tabs; the content; the footer.
 */
export default function NarrowUI( {
	search = true,
	searchLabel,
	tabsField,
	showSort = true,
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
			{ footer }
		</>
	);
}
