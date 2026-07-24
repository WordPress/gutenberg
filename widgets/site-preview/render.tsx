/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { Spinner } from '@wordpress/components';
import { Button, Icon, Stack, Text } from '@wordpress/ui';
import styles from './style.module.css';

function PreviewUrlBar( {
	siteUrl,
	siteIconUrl,
}: {
	siteUrl: string;
	siteIconUrl?: string;
} ) {
	return (
		<div className={ styles.urlBar }>
			<Stack
				direction="row"
				align="center"
				gap="xs"
				className={ styles.urlField }
			>
				{ siteIconUrl ? (
					<img
						className={ styles.urlFavicon }
						src={ siteIconUrl }
						alt=""
					/>
				) : (
					<Icon
						className={ styles.urlIcon }
						icon={ wordpress }
						size={ 12 }
					/>
				) }
				<Text className={ styles.urlText }>{ siteUrl }</Text>
			</Stack>
		</div>
	);
}

export default function SitePreview() {
	const [ isIframeLoading, setIsIframeLoading ] = useState( true );
	const [ isVisitLoading, setIsVisitLoading ] = useState( false );
	const [ isEditLoading, setIsEditLoading ] = useState( false );
	const { siteUrl, siteIconUrl } = useSelect( ( select ) => {
		const site = select( coreStore ).getEntityRecord< { url: string } >(
			'root',
			'site',
			undefined
		);
		const base = select( coreStore ).getEntityRecord< {
			site_icon_url?: string;
		} >( 'root', '__unstableBase', undefined );

		return {
			siteUrl: site?.url,
			siteIconUrl: base?.site_icon_url,
		};
	}, [] );

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

	const src = addQueryArgs( siteUrl, {
		wp_site_preview: 1,
	} );
	const editUrl = isBlockTheme ? 'site-editor.php' : 'customize.php';

	return (
		<Stack direction="column" className={ styles.container }>
			<PreviewUrlBar siteUrl={ siteUrl } siteIconUrl={ siteIconUrl } />
			<div className={ styles.previewWrap }>
				{ isIframeLoading && (
					<Stack
						direction="column"
						align="center"
						justify="center"
						className={ styles.loading }
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
				{ ! isIframeLoading && (
					<Stack
						direction="row"
						align="center"
						justify="center"
						gap="sm"
						className={ styles.overlay }
					>
						<Button
							variant="solid"
							tone="neutral"
							loading={ isVisitLoading }
							onClick={ () => {
								setIsVisitLoading( true );
								window.location.href = siteUrl;
							} }
						>
							{ __( 'Visit' ) }
						</Button>
						<Button
							variant="solid"
							tone="brand"
							loading={ isEditLoading }
							onClick={ () => {
								setIsEditLoading( true );
								window.location.href = editUrl;
							} }
						>
							{ __( 'Edit site' ) }
						</Button>
					</Stack>
				) }
			</div>
		</Stack>
	);
}
