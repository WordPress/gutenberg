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

const DEFAULT_PER_PAGE = 5;

type NewsAttributes = {
	perPage?: number;
};

export default function WordPressNews( {
	attributes,
}: {
	attributes?: NewsAttributes;
} ) {
	const perPage = Math.max( 1, attributes?.perPage ?? DEFAULT_PER_PAGE );

	return (
		<>
			<NewsList perPage={ perPage } />
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
