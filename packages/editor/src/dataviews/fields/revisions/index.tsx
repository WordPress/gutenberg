/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import type { BasePost } from '@wordpress/fields';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RevisionsView from './revisions-view';

const revisionsField: Field< BasePost > = {
	id: 'revisions',
	label: __( 'Revisions' ),
	readOnly: true,
	enableSorting: false,
	render: RevisionsView,
	isVisible: ( item ) => {
		const revisionsCount =
			item._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
		const lastRevisionId =
			item._links?.[ 'predecessor-version' ]?.[ 0 ]?.id ?? null;
		return !! lastRevisionId && revisionsCount >= 2;
	},
};

export default revisionsField;
