import apiFetch from '@wordpress/api-fetch';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { unlock } from '@wordpress/routes-lock-unlock';
import { addQueryArgs } from '@wordpress/url';
import { getPreviewedStylesheet } from './previewed-theme';

const { EntitiesSavedStatesExtensible, useEntitiesSavedStatesIsDirty } =
	unlock( coreDataPrivateApis );

declare global {
	interface Window {
		// Printed on `admin_head` by Core for `wp_theme_preview` requests.
		WP_BLOCK_THEME_ACTIVATE_NONCE?: string;
	}
}

const ACTIVE_THEMES_URL = '/wp/v2/themes?status=active';

type ActiveTheme = { name?: { rendered?: string } };

/**
 * The actually active theme: an empty `wp_theme_preview` makes Core's
 * middleware strip the parameter, so the endpoint reports the real active
 * theme rather than the previewed one.
 */
function useActualCurrentTheme() {
	const [ currentTheme, setCurrentTheme ] = useState< ActiveTheme >();

	useEffect( () => {
		const path = addQueryArgs( ACTIVE_THEMES_URL, {
			context: 'edit',
			wp_theme_preview: '',
		} );

		apiFetch< ActiveTheme[] >( { path } )
			.then( ( activeThemes ) => setCurrentTheme( activeThemes[ 0 ] ) )
			.catch( () => {} );
	}, [] );

	return currentTheme;
}

/**
 * Activates a theme through the classic themes screen action (there is no
 * REST endpoint for it). Core redirects to the themes screen, which
 * announces the activation.
 */
function activateTheme( stylesheet: string ) {
	window.location.href = addQueryArgs( 'themes.php', {
		action: 'activate',
		stylesheet,
		_wpnonce: window.WP_BLOCK_THEME_ACTIVATE_NONCE,
	} );
}

/**
 * The review-and-activate panel: the same flow as site editor v1's theme
 * preview, where activating saves any pending edits — global styles changes
 * included — against the previewed theme first, then switches to it.
 */
export function ActivatePanel( {
	themeName,
	onClose,
}: {
	themeName?: string;
	onClose: () => void;
} ) {
	const isDirtyProps = useEntitiesSavedStatesIsDirty();
	let activateSaveLabel, successNoticeContent;
	if ( isDirtyProps.isDirty ) {
		activateSaveLabel = __( 'Activate & Save' );
		successNoticeContent = __( 'Theme activated and site updated.' );
	} else {
		activateSaveLabel = __( 'Activate' );
		successNoticeContent = __( 'Theme activated.' );
	}

	const currentTheme = useActualCurrentTheme();

	const additionalPrompt = (
		<p>
			{ sprintf(
				/* translators: 1: The name of active theme, 2: The name of theme to be activated. */
				__(
					'Saving your changes will change your active theme from %1$s to %2$s.'
				),
				currentTheme?.name?.rendered ?? '...',
				themeName ?? '...'
			) }
		</p>
	);

	return (
		<EntitiesSavedStatesExtensible
			{ ...isDirtyProps }
			additionalPrompt={ additionalPrompt }
			close={ onClose }
			onSave={ () => activateTheme( getPreviewedStylesheet() ) }
			saveEnabled
			saveLabel={ activateSaveLabel }
			variant="inline"
			successNoticeContent={ successNoticeContent }
		/>
	);
}
