import { Page } from '@wordpress/admin-ui';
import { Button, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplate } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { Preview } from '@wordpress/lazy-editor';
import { store as noticesStore } from '@wordpress/notices';
import { addQueryArgs, getQueryArg } from '@wordpress/url';
import styles from './style.module.scss';

declare global {
	interface Window {
		/**
		 * Nonce for activating the previewed theme, printed on `admin_head`
		 * by Core's `wp_block_theme_activate_nonce()` whenever the request
		 * carries a `wp_theme_preview` parameter.
		 */
		WP_BLOCK_THEME_ACTIVATE_NONCE?: string;
	}
}

const FRONT_PAGE_TEMPLATE_QUERY = { slug: 'front-page' };

function ThemePreviewStage() {
	const previewParam = getQueryArg(
		window.location.href,
		'wp_theme_preview'
	);
	const previewedStylesheet =
		typeof previewParam === 'string' ? previewParam : '';
	const [ isActivating, setIsActivating ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );

	const { themeName, templateId, template } = useSelect( ( select ) => {
		const { getCurrentTheme, getDefaultTemplateId, getEntityRecord } =
			select( coreStore );
		// Every REST request on this screen carries the `wp_theme_preview`
		// parameter, so the "current" theme is the previewed one, and the
		// front page template resolves through the previewed theme's own
		// template hierarchy (front-page → home → index).
		const currentTheme = getCurrentTheme() as
			| { name?: { rendered?: string } }
			| null
			| undefined;
		const _templateId = getDefaultTemplateId(
			FRONT_PAGE_TEMPLATE_QUERY
		) as string | undefined;
		return {
			themeName: currentTheme?.name?.rendered
				? decodeEntities( currentTheme.name.rendered )
				: undefined,
			templateId: _templateId,
			template: _templateId
				? ( getEntityRecord(
						'postType',
						'wp_template',
						_templateId
				  ) as WpTemplate | undefined )
				: undefined,
		};
	}, [] );

	const activateTheme = async () => {
		setIsActivating( true );
		try {
			// There is no REST endpoint for activating a theme, so this goes
			// through the classic themes screen action, authorized by the
			// nonce Core prints for the previewed theme.
			const response = await window.fetch(
				addQueryArgs( 'themes.php', {
					action: 'activate',
					stylesheet: previewedStylesheet,
					_wpnonce: window.WP_BLOCK_THEME_ACTIVATE_NONCE,
				} )
			);
			if ( ! response.ok ) {
				throw new Error( response.statusText );
			}
			window.location.href = addQueryArgs( 'themes.php', {
				activated: 'true',
			} );
		} catch {
			setIsActivating( false );
			createErrorNotice( __( 'Theme activation failed.' ), {
				id: 'theme-preview-activate-error',
				type: 'snackbar',
			} );
		}
	};

	const previewDescription = __(
		'A preview of your site’s homepage with this theme.'
	);

	let activateLabel;
	if ( ! themeName ) {
		activateLabel = __( 'Activate' );
	} else if ( isActivating ) {
		activateLabel = sprintf(
			/* translators: %s: Theme name. */
			__( 'Activating %s' ),
			themeName
		);
	} else {
		activateLabel = sprintf(
			/* translators: %s: Theme name. */
			__( 'Activate %s' ),
			themeName
		);
	}

	let content;
	if ( templateId === '' ) {
		// The lookup resolved and the previewed theme has no block templates.
		content = (
			<p className={ styles.empty }>
				{ __( 'This theme has no templates to preview.' ) }
			</p>
		);
	} else if ( ! template ) {
		content = (
			<div className={ styles.loading }>
				<Spinner />
			</div>
		);
	} else {
		content = (
			<div className={ styles.frame }>
				<Preview
					content={ template.content?.raw }
					blocks={ template.blocks }
					description={ previewDescription }
				/>
			</div>
		);
	}

	return (
		<Page
			ariaLabel={ __( 'Theme Preview' ) }
			title={
				themeName
					? sprintf(
							/* translators: %s: Theme name. */
							__( 'Previewing %s' ),
							themeName
					  )
					: __( 'Theme Preview' )
			}
			subTitle={ previewDescription }
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
						{ activateLabel }
					</Button>
				</>
			}
		>
			<div className={ styles.content }>{ content }</div>
		</Page>
	);
}

export const stage = ThemePreviewStage;
