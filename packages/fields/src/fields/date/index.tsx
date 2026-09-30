import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import type { BasePost } from '../../types';
import { hasActionLink } from '../utils';
import DateView from './date-view';

const dateField: Field< BasePost > = {
	id: 'date',
	type: 'datetime',
	label: __( 'Date' ),
	render: DateView,
	isVisible: ( item ) => hasActionLink( item, 'wp:action-publish' ),
	filterBy: {
		operators: [ 'before', 'after' ],
	},
};

/**
 * Date field for BasePost.
 */
export default dateField;
