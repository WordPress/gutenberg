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
	return (
		<WCTooltip text={ fullDatetime } placement="top">
			<time dateTime={ value }>{ dateOnly }</time>
		</WCTooltip>
	);
}
