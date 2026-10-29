import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { filterURLForDisplay } from '@wordpress/url';
import { Text } from '@wordpress/ui';
import styles from './shell-site-identity.module.scss';

/**
 * The site's name and address, heading the menu. Its icon leads the title
 * box in the bar instead.
 *
 * @return The site identity.
 */
export default function ShellSiteIdentity() {
	const { name, url } = useSelect( ( select ) => {
		const base = select( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		) as { name?: string; home?: string } | undefined;
		return {
			name: decodeEntities( base?.name ?? '' ),
			url: base?.home ? filterURLForDisplay( base.home ) : '',
		};
	}, [] );

	return (
		<div className={ styles.identity }>
			<Text variant="body-md" className={ styles.name }>
				{ name || __( 'Site' ) }
			</Text>
			{ url && (
				<Text variant="body-sm" className={ styles.url }>
					{ url }
				</Text>
			) }
		</div>
	);
}
