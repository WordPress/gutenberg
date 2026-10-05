import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type SyntheticEvent,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as bootStore } from '@wordpress/boot';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs, getProtocol } from '@wordpress/url';
import { useNavigate, useSearch } from '@wordpress/route';
import { layout, moreVertical, page, post } from '@wordpress/icons';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { Badge, Icon, Stack, Text } from '@wordpress/ui';
import styles from './style.module.scss';

const PREVIEW_CONTEXT_ID = 'wp-site-preview-context';
const PREVIEW_QUERY_ARG = 'wp_site_preview';

// The previewed location is kept in the route's `preview` search param, so
// returning through history restores it. The context of that location is
// kept here so the bar is filled in before the iframe loads again.
let lastPreviewContext: PreviewContext | null = null;

type PreviewContext = {
	url: string;
	postType: string;
	postTypeLabel: string;
	postId: string;
	postTitle: string;
	templateId: string;
	templateTitle: string;
};

function isPreviewContext( value: unknown ): value is PreviewContext {
	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	const candidate = value as Record< string, unknown >;
	return (
		typeof candidate.url === 'string' &&
		typeof candidate.postType === 'string' &&
		typeof candidate.postTypeLabel === 'string' &&
		typeof candidate.postId === 'string' &&
		typeof candidate.postTitle === 'string' &&
		typeof candidate.templateId === 'string' &&
		typeof candidate.templateTitle === 'string'
	);
}

function readPreviewContext( iframeDocument: Document ): PreviewContext | null {
	const script = iframeDocument.getElementById( PREVIEW_CONTEXT_ID );
	if ( ! script?.textContent ) {
		return null;
	}

	try {
		const parsed: unknown = JSON.parse( script.textContent );
		return isPreviewContext( parsed ) ? parsed : null;
	} catch {
		return null;
	}
}

function isModifiedClick( event: MouseEvent ): boolean {
	return (
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	);
}

function searchWithoutPreviewArg( url: URL ): string {
	const params = new URLSearchParams( url.search );
	params.delete( PREVIEW_QUERY_ARG );
	return params.toString();
}

function isInPageHashNavigation( href: string, currentHref: string ): boolean {
	try {
		const target = new URL( href, currentHref );
		const current = new URL( currentHref );
		return (
			target.origin === current.origin &&
			target.pathname === current.pathname &&
			searchWithoutPreviewArg( target ) ===
				searchWithoutPreviewArg( current ) &&
			!! target.hash
		);
	} catch {
		return false;
	}
}

function isFrontEndUrl( href: string, siteUrl: string ): boolean {
	let target: URL;
	let site: URL;
	try {
		target = new URL( href, siteUrl );
		site = new URL( siteUrl );
	} catch {
		return false;
	}

	if ( target.origin !== site.origin ) {
		return false;
	}

	const protocol = getProtocol( target.href );
	if ( protocol && protocol !== 'http:' && protocol !== 'https:' ) {
		return false;
	}

	if ( /\/wp-admin(?:\/|$)/.test( target.pathname ) ) {
		return false;
	}

	if ( /wp-login\.php$/.test( target.pathname ) ) {
		return false;
	}

	return true;
}

function getPreviewPath( url: string ): string {
	const { pathname, search, hash } = new URL( url );
	return `${ pathname }${ search }${ hash }`;
}

function getPreviewTarget( preview: unknown, siteUrl: string ): string {
	if ( typeof preview === 'string' && preview.startsWith( '/' ) ) {
		const target = new URL( preview, siteUrl ).href;
		if ( isFrontEndUrl( target, siteUrl ) ) {
			return target;
		}
	}

	return siteUrl;
}

function getEntityIcon( context: PreviewContext | null ) {
	if ( context?.postType === 'post' ) {
		return post;
	}

	// Other post types cannot declare their own icon yet.
	if ( context?.postType ) {
		return page;
	}

	return layout;
}

function getEntityTitle( context: PreviewContext ): string {
	if ( context.postType ) {
		return context.postTitle || __( '(no title)' );
	}

	return context.templateTitle || __( 'Template' );
}

function getEntityLabel( context: PreviewContext ): string {
	if ( context.postType ) {
		return sprintf(
			/* translators: 1: post type label, e.g. "Page". 2: post title. */
			__( '%1$s: %2$s' ),
			context.postTypeLabel || __( 'Page' ),
			getEntityTitle( context )
		);
	}

	if ( context.templateTitle ) {
		return sprintf(
			/* translators: %s: template title, e.g. "Index". */
			__( 'Template: %s' ),
			context.templateTitle
		);
	}

	return __( 'Template' );
}

function getEditLabel( context: PreviewContext | null ): string {
	if ( context?.postType === 'post' ) {
		return __( 'Edit post' );
	}

	if ( context?.postType === 'page' ) {
		return __( 'Edit page' );
	}

	if ( context?.postType && context.postTypeLabel ) {
		return sprintf(
			/* translators: %s: singular post type label, e.g. "Product". */
			__( 'Edit %s' ),
			context.postTypeLabel
		);
	}

	return __( 'Edit template' );
}

function bindPreviewNavigation(
	iframe: HTMLIFrameElement,
	siteUrl: string
): void {
	const iframeDocument = iframe.contentDocument;
	const iframeWindow = iframe.contentWindow as
		( Window & typeof globalThis ) | null;
	if ( ! iframeDocument || ! iframeWindow || ! siteUrl ) {
		return;
	}

	iframeDocument.addEventListener(
		'click',
		( event ) => {
			if ( event.defaultPrevented || isModifiedClick( event ) ) {
				return;
			}

			const eventTarget = event.target;
			if ( ! ( eventTarget instanceof iframeWindow.Element ) ) {
				return;
			}

			const anchor = eventTarget.closest( 'a[href]' );
			if ( ! anchor || anchor.hasAttribute( 'download' ) ) {
				return;
			}

			const href = anchor.getAttribute( 'href' );
			if ( ! href ) {
				return;
			}

			const resolvedHref = new URL( href, iframeWindow.location.href )
				.href;

			if (
				isInPageHashNavigation(
					resolvedHref,
					iframeWindow.location.href
				)
			) {
				return;
			}

			if ( ! isFrontEndUrl( resolvedHref, siteUrl ) ) {
				event.preventDefault();
				event.stopPropagation();
				window.open( resolvedHref, '_blank', 'noopener' );
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			iframe.src = addQueryArgs( resolvedHref, {
				[ PREVIEW_QUERY_ARG ]: 1,
			} );
		},
		true
	);

	iframeDocument.addEventListener(
		'submit',
		( event ) => {
			const form = event.target;
			if ( ! ( form instanceof iframeWindow.HTMLFormElement ) ) {
				return;
			}

			let actionUrl: string;
			try {
				actionUrl = new URL(
					form.getAttribute( 'action' ) || '',
					iframeWindow.location.href
				).href;
			} catch {
				return;
			}

			if ( ! isFrontEndUrl( actionUrl, siteUrl ) ) {
				form.target = '_blank';
				return;
			}

			form.target = '';
			form.setAttribute(
				'action',
				addQueryArgs( actionUrl, { [ PREVIEW_QUERY_ARG ]: 1 } )
			);
		},
		true
	);
}

function HomePreview() {
	const siteUrl = useSelect( ( select ) => {
		const siteData = select( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		) as { home?: unknown } | undefined;
		return typeof siteData?.home === 'string' ? siteData.home : undefined;
	}, [] );

	return siteUrl ? <PreviewFrame siteUrl={ siteUrl } /> : null;
}

function PreviewFrame( { siteUrl }: { siteUrl: string } ) {
	const navigate = useNavigate();
	const { preview } = useSearch( { strict: false } ) as {
		preview?: unknown;
	};
	const targetUrl = getPreviewTarget( preview, siteUrl );
	const [ initialSrc ] = useState( () =>
		addQueryArgs( targetUrl, { [ PREVIEW_QUERY_ARG ]: 1 } )
	);
	const [ context, setContext ] = useState< PreviewContext | null >( () =>
		lastPreviewContext?.url &&
		getPreviewPath( lastPreviewContext.url ) === getPreviewPath( targetUrl )
			? lastPreviewContext
			: null
	);
	const iframeRef = useRef< HTMLIFrameElement >( null );
	const loadedUrlRef = useRef< string | null >( null );

	// Follows navigation that changes the search param from outside the
	// iframe, such as the Home navigation item.
	useEffect( () => {
		const iframe = iframeRef.current;
		if (
			! iframe ||
			! loadedUrlRef.current ||
			getPreviewPath( loadedUrlRef.current ) ===
				getPreviewPath( targetUrl )
		) {
			return;
		}

		loadedUrlRef.current = targetUrl;
		iframe.src = addQueryArgs( targetUrl, { [ PREVIEW_QUERY_ARG ]: 1 } );
	}, [ targetUrl ] );

	const { contentEditLink, templateEditLink } = useSelect(
		( select ) => {
			const { getEntityLink } = select( bootStore );
			return {
				contentEditLink:
					context?.postType && context.postId
						? getEntityLink( context.postType, context.postId )
						: undefined,
				templateEditLink: context?.templateId
					? getEntityLink( 'wp_template', context.templateId )
					: undefined,
			};
		},
		[ context ]
	);

	const onIframeLoad = useCallback(
		( event: SyntheticEvent< HTMLIFrameElement > ) => {
			const iframe = event.currentTarget;
			const iframeDocument = iframe.contentDocument;
			if ( ! iframeDocument ) {
				return;
			}

			const loadedContext = readPreviewContext( iframeDocument );
			lastPreviewContext = loadedContext;
			setContext( loadedContext );
			bindPreviewNavigation( iframe, siteUrl );

			const loadedUrl = loadedContext?.url;
			if ( ! loadedUrl || ! isFrontEndUrl( loadedUrl, siteUrl ) ) {
				return;
			}

			loadedUrlRef.current = loadedUrl;
			const loadedPath = getPreviewPath( loadedUrl );
			if ( loadedPath === getPreviewPath( targetUrl ) ) {
				return;
			}

			navigate( {
				to: '/',
				search:
					loadedPath === getPreviewPath( siteUrl )
						? {}
						: { preview: loadedPath },
				replace: true,
			} );
		},
		[ navigate, siteUrl, targetUrl ]
	);

	const publicUrl = context?.url || siteUrl;
	const editLink = contentEditLink ?? templateEditLink;
	const openEditor = ( to: string ) => navigate( { to } );

	return (
		<div className={ styles.preview }>
			<Stack
				direction="row"
				align="center"
				gap="sm"
				className={ styles.chrome }
				render={
					<div
						role="region"
						aria-label={ __( 'Preview address bar' ) }
					/>
				}
			>
				<Stack
					direction="row"
					align="center"
					gap="xs"
					className={ styles.url }
				>
					{ context ? (
						<Icon
							className={ styles[ 'url-icon' ] }
							icon={ getEntityIcon( context ) }
							size={ 20 }
						/>
					) : null }
					<Text className={ styles[ 'url-text' ] } variant="body-sm">
						{ publicUrl }
					</Text>
					{ context ? (
						<Badge className={ styles[ 'url-badge' ] }>
							{ getEntityLabel( context ) }
						</Badge>
					) : null }
				</Stack>
				<Stack
					direction="row"
					align="center"
					gap="xs"
					className={ styles.actions }
				>
					<Button
						variant="primary"
						size="compact"
						accessibleWhenDisabled
						disabled={ ! editLink }
						onClick={ () => {
							if ( editLink ) {
								openEditor( editLink );
							}
						} }
					>
						{ getEditLabel( contentEditLink ? context : null ) }
					</Button>
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'More actions' ) }
						toggleProps={ { size: 'compact' } }
						popoverProps={ { placement: 'bottom-end' } }
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								<MenuItem
									onClick={ () => {
										onClose();
										window.open(
											publicUrl,
											'_blank',
											'noopener'
										);
									} }
								>
									{ __( 'View' ) }
								</MenuItem>
								{ contentEditLink && templateEditLink ? (
									<MenuItem
										onClick={ () => {
											onClose();
											openEditor( templateEditLink );
										} }
									>
										{ __( 'Edit template' ) }
									</MenuItem>
								) : null }
							</MenuGroup>
						) }
					</DropdownMenu>
				</Stack>
			</Stack>
			<iframe
				ref={ iframeRef }
				className={ styles.iframe }
				src={ initialSrc }
				title={ __( 'Site preview' ) }
				onLoad={ onIframeLoad }
			/>
		</div>
	);
}

export const canvas = HomePreview;
