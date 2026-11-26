import { useCallback, useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useNavigate } from '@wordpress/route';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { store as bootStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * The query argument that marks a front-end request as the site editor's
 * preview: it hides the admin bar and makes the server describe what it
 * rendered.
 */
const PREVIEW_QUERY_ARG = 'wp_site_preview';

/**
 * ID of the script tag the server prints into a previewed page, see
 * `gutenberg_print_site_preview_context()`.
 */
const CONTEXT_ELEMENT_ID = 'wp-site-preview-context';

/**
 * What the server says a previewed page shows.
 */
interface PreviewContext {
	/**
	 * The post a singular page shows, when the user can edit it.
	 */
	postType?: string;
	postId?: number;

	/**
	 * The block template the page was rendered with.
	 */
	templateId?: string;
}

interface Entity {
	postType: string;
	postId: string | number;
}

/**
 * Reads what the previewed page shows.
 *
 * @param iframeDocument The previewed page.
 * @return The context the server printed, or undefined when there is none.
 */
function readPreviewContext(
	iframeDocument: Document
): PreviewContext | undefined {
	const element = iframeDocument.getElementById( CONTEXT_ELEMENT_ID );

	if ( ! element?.textContent ) {
		return undefined;
	}

	try {
		const context = JSON.parse( element.textContent );
		return context && typeof context === 'object' ? context : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Picks the entity that editing a previewed page should open: the post it
 * shows, or failing that the template it was rendered with.
 *
 * @param context What the previewed page shows.
 * @return The entity, or undefined when the page names none.
 */
function getEntityFromContext( context?: PreviewContext ): Entity | undefined {
	if ( typeof context?.postType === 'string' && context.postId ) {
		return { postType: context.postType, postId: context.postId };
	}

	if ( typeof context?.templateId === 'string' && context.templateId ) {
		return { postType: 'wp_template', postId: context.templateId };
	}

	return undefined;
}

/**
 * Keeps navigation inside the preview on the site's own front end.
 *
 * Links to other pages of the site load in the preview and carry the query
 * argument that keeps it a preview, so the admin bar stays hidden and the
 * server keeps saying what each page shows. Anything else — another site, the
 * admin, a download — opens in a new tab rather than inside the editor.
 *
 * @param iframeDocument The previewed page.
 * @param siteUrl        The site's home URL.
 */
function keepNavigationInPreview( iframeDocument: Document, siteUrl: string ) {
	const site = new URL( siteUrl );
	const adminPath = new URL( 'wp-admin/', site.href.replace( /\/?$/, '/' ) )
		.pathname;

	const isFrontEnd = ( url: URL ) =>
		url.origin === site.origin &&
		url.pathname.startsWith( site.pathname ) &&
		! url.pathname.startsWith( adminPath ) &&
		! url.pathname.endsWith( '/wp-login.php' );

	iframeDocument.addEventListener( 'click', ( event ) => {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}

		const link = ( event.target as Element | null )?.closest?.(
			'a[href]'
		) as HTMLAnchorElement | null;

		if ( ! link || link.hasAttribute( 'download' ) ) {
			return;
		}

		const url = new URL( link.href, iframeDocument.baseURI );

		// Links within the page, such as a "skip to content" link.
		if (
			url.hash &&
			url.origin === iframeDocument.location.origin &&
			url.pathname === iframeDocument.location.pathname &&
			url.search === iframeDocument.location.search
		) {
			return;
		}

		event.preventDefault();

		if ( ! isFrontEnd( url ) ) {
			iframeDocument.defaultView?.open(
				url.href,
				'_blank',
				'noopener,noreferrer'
			);
			return;
		}

		iframeDocument.location.assign(
			addQueryArgs( url.href, { [ PREVIEW_QUERY_ARG ]: 1 } )
		);
	} );

	// Searches and other forms that only read keep the preview too.
	iframeDocument
		.querySelectorAll< HTMLFormElement >( 'form' )
		.forEach( ( form ) => {
			if (
				form.method.toLowerCase() !== 'get' ||
				form.elements.namedItem( PREVIEW_QUERY_ARG )
			) {
				return;
			}
			const input = iframeDocument.createElement( 'input' );
			input.type = 'hidden';
			input.name = PREVIEW_QUERY_ARG;
			input.value = '1';
			form.appendChild( input );
		} );
}

/**
 * Renders the site's front end, which the user can browse, with a button that
 * opens whatever they are looking at for editing.
 *
 * Unlike the editor-based preview, it shows the site as visitors see it: what
 * is saved, not edits waiting to be saved.
 *
 * @return The preview, or nothing until the site's address is known.
 */
export default function BrowsePreview() {
	const navigate = useNavigate();

	// What the page on screen shows. `null` until a page has loaded, and when
	// the page could not be read, which leaves the home page to edit.
	const [ pageEntity, setPageEntity ] = useState< Entity | null >( null );

	const { siteUrl, homePage } = useSelect( ( select ) => {
		const siteData = select( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		) as { home?: unknown } | undefined;

		return {
			siteUrl: siteData?.home,
			homePage: unlock( select( coreStore ) ).getHomePage() as
				Partial< Entity > | null | undefined,
		};
	}, [] );

	const entity: Entity | undefined =
		pageEntity ??
		( homePage?.postType && homePage?.postId
			? { postType: homePage.postType, postId: homePage.postId }
			: undefined );

	const entityType = entity?.postType;
	const entityId = entity?.postId;
	const { editLink, editLabel } = useSelect(
		( select ) => {
			if ( ! entityType || ! entityId ) {
				return { editLink: undefined, editLabel: undefined };
			}

			const postType = select( coreStore ).getPostType( entityType ) as
				{ labels?: { edit_item?: string } } | undefined;

			return {
				editLink: select( bootStore ).getEntityLink(
					entityType,
					entityId
				),
				editLabel: postType?.labels?.edit_item,
			};
		},
		[ entityType, entityId ]
	);

	const onLoad = useCallback(
		( event: React.SyntheticEvent< HTMLIFrameElement > ) => {
			let iframeDocument: Document | null = null;

			try {
				iframeDocument = event.currentTarget.contentDocument;
			} catch {
				// Not readable when the site is served from another origin.
			}

			if ( ! iframeDocument || typeof siteUrl !== 'string' ) {
				setPageEntity( null );
				return;
			}

			keepNavigationInPreview( iframeDocument, siteUrl );
			setPageEntity(
				getEntityFromContext( readPreviewContext( iframeDocument ) ) ??
					null
			);
		},
		[ siteUrl ]
	);

	// `home` comes from the REST index. Without a usable URL the iframe would
	// resolve its `src` against the current admin page and embed that instead,
	// so render nothing until there is one.
	if ( typeof siteUrl !== 'string' || ! siteUrl ) {
		return null;
	}

	return (
		<div style={ { height: '100%', position: 'relative' } }>
			<iframe
				src={ addQueryArgs( siteUrl, { [ PREVIEW_QUERY_ARG ]: 1 } ) }
				title={ __( 'Site Preview' ) }
				onLoad={ onLoad }
				style={ {
					display: 'block',
					width: '100%',
					height: '100%',
					border: 0,
					backgroundColor: '#fff',
				} }
			/>
			{ editLink && (
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ () => navigate( { to: editLink } ) }
					style={ {
						position: 'absolute',
						insetBlockStart: 16,
						insetInlineEnd: 16,
						zIndex: 1,
					} }
				>
					{ editLabel ?? __( 'Edit' ) }
				</Button>
			) }
		</div>
	);
}
