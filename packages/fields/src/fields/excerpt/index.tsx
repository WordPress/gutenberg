/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	ExternalLink,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
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
		let excerpt;
		if ( typeof item.excerpt === 'string' ) {
			excerpt = !! item.excerpt
				? decodeEntities( item.excerpt )
				: __( 'Add an excerpt' );
		} else {
			excerpt = decodeEntities( item.excerpt?.raw || '' );
		}
		return (
			<Text align="left" numberOfLines={ 4 } truncate>
				{ excerpt }
			</Text>
		);
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
