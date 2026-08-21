import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import type { Theme } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { setupPreviewNavigation } from './preview-navigation';
import {
	getPreviewQueryArgs,
	getPreviewTitle,
	getPreviewedStylesheet,
} from './previewed-theme';
import styles from './style.module.scss';

declare global {
	interface Window {
		// Theme activation nonce, printed on `admin_head` by Core's
		// `wp_block_theme_activate_nonce()` for `wp_theme_preview` requests.
		WP_BLOCK_THEME_ACTIVATE_NONCE?: string;
	}
}

function ThemePreviewStage() {
	const stylesheet = getPreviewedStylesheet();
	const [ isActivating, setIsActivating ] = useState( false );

	const { themeName, homeUrl } = useSelect( ( select ) => {
		const { getCurrentTheme, getEntityRecord } = select( coreStore );
		// The "current" theme is the previewed one: every REST request on
		// this screen carries the `wp_theme_preview` parameter.
		const theme = getCurrentTheme() as Theme | null | undefined;
		return {
			themeName: theme?.name?.rendered
				? decodeEntities( theme.name.rendered )
				: undefined,
			homeUrl: getEntityRecord< { home?: string } >(
				'root',
				'__unstableBase',
				undefined
			)?.home,
		};
	}, [] );

	const previewArgs = useMemo(
		() => getPreviewQueryArgs( stylesheet ),
		[ stylesheet ]
	);
	const previewSrc = useMemo(
		() => ( homeUrl ? addQueryArgs( homeUrl, previewArgs ) : undefined ),
		[ homeUrl, previewArgs ]
	);

	const activateTheme = () => {
		setIsActivating( true );
		// There is no REST endpoint for activating a theme, so this follows
		// the classic themes screen action, authorized by the nonce Core
		// prints for the previewed theme. Core redirects to the themes
		// screen, which announces the activation; failures like an expired
		// nonce render Core's standard error screen, exactly as the themes
		// screen's own Activate link does.
		window.location.href = addQueryArgs( 'themes.php', {
			action: 'activate',
			stylesheet,
			_wpnonce: window.WP_BLOCK_THEME_ACTIVATE_NONCE,
		} );
	};

	return (
		<Page
			title={ getPreviewTitle( themeName ) }
			subTitle={ __( 'A preview of your site with this theme.' ) }
			actions={
				<>
					<Button size="compact" variant="tertiary" href="themes.php">
						{ __( 'Back to themes' ) }
					</Button>
					<Button
						size="compact"
						variant="primary"
						isBusy={ isActivating }
						disabled={ isActivating }
						accessibleWhenDisabled
						onClick={ activateTheme }
					>
						{ themeName
							? sprintf(
									/* translators: %s: Theme name. */
									__( 'Activate %s' ),
									themeName
							  )
							: __( 'Activate' ) }
					</Button>
				</>
			}
		>
			{ previewSrc && (
				<iframe
					className={ styles.preview }
					src={ previewSrc }
					title={ __( 'Theme Preview' ) }
					onLoad={ ( event ) => {
						const doc = ( event.target as HTMLIFrameElement )
							.contentDocument;
						// Not readable when the site is served from another
						// origin; navigation then leaves the previewed theme.
						if ( doc && homeUrl ) {
							setupPreviewNavigation( doc, homeUrl, previewArgs );
						}
					} }
				/>
			) }
		</Page>
	);
}

export const stage = ThemePreviewStage;
