import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';
import type { MediaItem } from '../types';

/**
 * Whether the attachment is referenced somewhere on the site.
 *
 * The value comes from the `used` REST field registered by the media usage
 * detection. It is a computed, read-only signal, so it can be filtered (the
 * Media Library's "Unused" view locks it to `Unused`) but not edited or sorted.
 *
 * Detecting usage scans the site content, so the REST API only computes the
 * field when the request asks for it. Where it was not requested the value is
 * `null`, and the field hides itself rather than showing an empty cell — the
 * media editor's details form, for instance, does not ask for it.
 */
const usedField: Partial< Field< MediaItem > > = {
	id: 'used',
	type: 'boolean',
	label: __( 'Usage' ),
	getValue: ( { item }: { item: MediaItem } ) => item.used,
	isVisible: ( item: MediaItem ) =>
		item.used !== undefined && item.used !== null,
	enableSorting: false,
	elements: [
		{ value: true, label: __( 'Used' ) },
		{ value: false, label: __( 'Unused' ) },
	],
	filterBy: { operators: [ 'is' ] },
	readOnly: true,
};

export default usedField;
