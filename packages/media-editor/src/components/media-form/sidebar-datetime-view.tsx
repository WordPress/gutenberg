/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { Tooltip as WCTooltip } from '@wordpress/components';
import type { NormalizedField } from '@wordpress/dataviews';

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
	// `aria-label` makes assistive tech announce the full date (the visible
	// text is a shortened summary; `<time dateTime>` is for machines, not
	// announced by screen readers). `tabIndex={-1}` keeps the Tooltip anchor
	// out of the keyboard tab order — Ariakit's `useFocusable` preserves an
	// explicit `tabIndex` on non-natively-focusable elements rather than
	// defaulting it to `0`. The Tooltip remains available on mouse hover.
	return (
		<WCTooltip text={ fullDatetime } placement="top">
			<time
				dateTime={ value }
				aria-label={ fullDatetime }
				tabIndex={ -1 }
			>
				{ dateOnly }
			</time>
		</WCTooltip>
	);
}
