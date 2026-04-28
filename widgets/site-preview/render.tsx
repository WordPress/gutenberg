/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card } from '@wordpress/ui';
import styles from './style.module.css';

export default function SitePreview() {
	const siteUrl = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord< { url: string } >(
				'root',
				'site',
				undefined
			)?.url,
		[]
	);

	if ( ! siteUrl ) {
		return null;
	}

	const src = `${ siteUrl }/?hide_banners=true&preview_overlay=true&preview=true`;

	return (
		<Card.FullBleed className={ styles.container }>
			<iframe
				className={ styles.iframe }
				loading="lazy"
				title={ __( 'Site Preview' ) }
				src={ src }
				// @ts-expect-error — `inert` is not yet in React's HTMLAttributes
				inert="true"
			></iframe>
		</Card.FullBleed>
	);
}
