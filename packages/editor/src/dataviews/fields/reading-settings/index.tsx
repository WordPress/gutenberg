import type { Field } from '@wordpress/dataviews';
import type { BasePost } from '@wordpress/fields';
import { __ } from '@wordpress/i18n';
import ReadingSettingsLink from '../../../components/reading-settings-link';

const readingSettingsField: Field< BasePost > = {
	id: 'reading_settings',
	// The field renders a link rather than a value, but the `regular` form
	// layout skips any field without an `Edit` control even when it is read
	// only, and the control is resolved from the type.
	type: 'text',
	label: __( 'Reading settings' ),
	readOnly: true,
	enableSorting: false,
	render: ReadingSettingsLink,
	isVisible: ( item ) => item.slug === 'front-page',
};

export default readingSettingsField;
