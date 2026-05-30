/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import type { NormalizedField } from '@wordpress/dataviews';
// eslint-disable-next-line @wordpress/use-recommended-components -- `Tooltip` is not yet on the recommended `@wordpress/ui` allow-list; landing as a migration step ahead of the wider rollout.
import { Tooltip } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { Media } from '../media-editor-provider';

export default function SidebarDatetimeView( {
	item,
	field,
}: {
	item: Media;
	field: NormalizedField< Media >;
} ) {
	const value = field.getValue( { item } ) as string | null | undefined;
	if ( ! value ) {
		return null;
	}
	const settings = getSettings();
	const dateOnly = dateI18n( settings.formats.date, getDate( value ) );
	const fullDatetime = dateI18n(
		settings.formats.datetimeAbbreviated,
		getDate( value )
	);
	// `aria-label` exposes the full date to assistive tech; the visible text
	// is a shortened summary (`<time dateTime>` is for machines, not announced
	// by screen readers). The Tooltip remains available on mouse hover.
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<time dateTime={ value } aria-label={ fullDatetime }>
						{ dateOnly }
					</time>
				}
			/>
			<Tooltip.Popup>{ fullDatetime }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
