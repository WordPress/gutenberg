/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { NewsList } from './components';
import styles from './render.module.css';

export default function WordPressNews() {
	return (
		<>
			<NewsList />
			<div className={ styles.footer }>
				<Link
					href={ _x(
						'https://wordpress.org/news/all-posts/',
						'News dashboard widget'
					) }
					openInNewTab
				>
					{ __( 'See all' ) }
				</Link>
			</div>
		</>
	);
}
