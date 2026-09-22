import type { Field } from '@wordpress/dataviews';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	ExternalLink,
	__experimentalText as WCText,
} from '@wordpress/components';
import type { BasePost } from '../../types';

const excerptField: Field< BasePost > = {
	id: 'excerpt',
	type: 'text',
	label: __( 'Excerpt' ),
	placeholder: __( 'Add an excerpt' ),
	description: (
		<ExternalLink
			href={ __(
				'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt'
			) }
		>
			{ __( 'Learn more about manual excerpts' ) }
		</ExternalLink>
	),
	render: ( { item } ) => {
		const excerpt =
			typeof item.excerpt === 'string' ? item.excerpt : item.excerpt?.raw;
		return excerpt ? (
			<WCText align="left" numberOfLines={ 3 } truncate>
				{ decodeEntities( excerpt ) }
			</WCText>
		) : null;
	},
	Edit: {
		control: 'textarea',
		rows: 4,
	},
	enableSorting: false,
	filterBy: false,
};

/**
 * Excerpt field for BasePost.
 */
export default excerptField;
