/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Card } from '@wordpress/ui';
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

	const isBlockTheme = useSelect(
		( select ) =>
			!! ( select( coreStore ) as any ).getCurrentTheme()?.is_block_theme,
		[]
	);

	if ( ! siteUrl ) {
		return null;
	}

	const src = `${ siteUrl }/?hide_banners=true&preview_overlay=true&preview=true`;
	const editUrl = isBlockTheme ? 'site-editor.php' : 'customize.php';

	return (
		<Card.FullBleed className={ styles.container }>
			<div className={ styles.previewWrap }>
				<iframe
					className={ styles.iframe }
					loading="lazy"
					title={ __( 'Site Preview' ) }
					src={ src }
					// @ts-expect-error — `inert` is not yet in React's HTMLAttributes
					inert="true"
				></iframe>
				<div className={ styles.overlay }>
					<Button
						variant="solid"
						tone="neutral"
						onClick={ () => {
							window.location.href = editUrl;
						} }
					>
						{ __( 'Edit site' ) }
					</Button>
				</div>
			</div>
		</Card.FullBleed>
	);
}
