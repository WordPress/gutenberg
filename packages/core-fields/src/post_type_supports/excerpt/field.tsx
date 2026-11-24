import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import type { FieldsScriptParts } from '../../types';
import styles from './style.module.css';

interface PostWithExcerpt {
	excerpt?: string | { raw?: string };
}

/**
 * The JavaScript parts of the excerpt field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithExcerpt >[ string ] = {
	description: (
		<Link
			href={ __(
				'https://wordpress.org/documentation/article/page-post-settings-sidebar/#excerpt'
			) }
			openInNewTab
		>
			{ __( 'Learn more about manual excerpts' ) }
		</Link>
	),
	// Shows the first three lines of the excerpt, as plain text that takes the
	// typography of where it renders, like the values of other fields.
	render: ( { item } ) => {
		const excerpt =
			typeof item.excerpt === 'string' ? item.excerpt : item.excerpt?.raw;
		return excerpt ? (
			<span className={ styles.excerpt }>
				{ decodeEntities( excerpt ) }
			</span>
		) : null;
	},
};
