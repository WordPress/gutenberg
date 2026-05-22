/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Stack } from '@wordpress/ui';
import styles from './style.module.css';

export default function SitePreview() {
	const [ isIframeLoading, setIsIframeLoading ] = useState( true );
	const [ isEditLoading, setIsEditLoading ] = useState( false );
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

	useEffect( () => {
		setIsIframeLoading( true );
	}, [ siteUrl ] );

	if ( ! siteUrl ) {
		return null;
	}

	const src = `${ siteUrl }/?hide_banners=true&preview_overlay=true&preview=true`;
	const editUrl = isBlockTheme ? 'site-editor.php' : 'customize.php';

	return (
		<div className={ styles.container }>
			<div className={ styles.previewWrap }>
				{ isIframeLoading && (
					<Stack
						align="center"
						justify="center"
						style={ { minHeight: 220 } }
					>
						<Spinner />
					</Stack>
				) }
				<iframe
					className={ styles.iframe }
					loading="lazy"
					scrolling="no"
					title={ __( 'Site preview' ) }
					src={ src }
					onLoad={ () => setIsIframeLoading( false ) }
					// @ts-expect-error — `inert` is not yet in React's HTMLAttributes
					inert="true"
				></iframe>
				<Stack
					align="center"
					justify="center"
					className={ styles.overlay }
				>
					<Button
						variant="solid"
						tone="neutral"
						loading={ isEditLoading }
						onClick={ () => {
							setIsEditLoading( true );
							window.location.href = editUrl;
						} }
					>
						{ __( 'Edit site' ) }
					</Button>
				</Stack>
			</div>
		</div>
	);
}
