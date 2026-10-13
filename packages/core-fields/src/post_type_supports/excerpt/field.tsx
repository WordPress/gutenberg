import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import type { FieldsScriptParts } from '@wordpress/fields-loader';
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
	// Shows the first three lines of the excerpt.
	render: ( { item } ) => {
		const excerpt =
			typeof item.excerpt === 'string' ? item.excerpt : item.excerpt?.raw;
		return excerpt ? (
			<Text className={ styles.excerpt }>
				{ decodeEntities( excerpt ) }
			</Text>
		) : null;
	},
};
