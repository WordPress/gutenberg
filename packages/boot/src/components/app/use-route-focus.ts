import { useEffect, useRef, type RefObject } from '@wordpress/element';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { unlock } from '../../lock-unlock';
import styles from '../root/style.module.scss';

const { useRouter, useRouterState } = unlock( routePrivateApis );

/**
 * Elements with the same value of this attribute on two pages are the same
 * control, such as a section navigation link that each section page renders.
 */
const FOCUS_KEY_ATTRIBUTE = 'data-focus-key';

/**
 * Hook that moves focus when a navigation removes the focused element.
 * Otherwise focus falls back to the document body, and keyboard and screen
 * reader users lose their place.
 *
 * Focus moves to the element on the new page with the same focus key as the
 * removed element, or else to the new page's region, such as when a breadcrumb
 * link becomes the new page's heading.
 *
 * It runs in an effect after the route resolves. Effects of the page content
 * run before it, so the page can move focus itself first.
 *
 * @param layoutRef Ref to the layout element that contains the stage.
 */
export default function useRouteFocus(
	layoutRef: RefObject< HTMLElement | null >
) {
	const router = useRouter();
	const href: string | undefined = useRouterState( {
		select: ( state: { resolvedLocation?: { href: string } } ) =>
			state.resolvedLocation?.href,
	} );
	const previousHrefRef = useRef( href );
	const focusKeyRef = useRef< string | null >( null );

	useEffect(
		() =>
			// Read the key when the navigation starts, while the focused element
			// is still in the document.
			router.subscribe( 'onBeforeNavigate', () => {
				focusKeyRef.current =
					layoutRef.current?.ownerDocument.activeElement
						?.closest( `[${ FOCUS_KEY_ATTRIBUTE }]` )
						?.getAttribute( FOCUS_KEY_ATTRIBUTE ) ?? null;
			} ),
		[ router, layoutRef ]
	);

	useEffect( () => {
		const previousHref = previousHrefRef.current;
		previousHrefRef.current = href;

		// The initial page load has no previous location.
		if ( ! previousHref || href === previousHref ) {
			return;
		}

		const layout = layoutRef.current;
		if ( ! layout ) {
			return;
		}

		const { activeElement, body } = layout.ownerDocument;
		if ( activeElement && activeElement !== body ) {
			return;
		}

		const focusKey = focusKeyRef.current;
		const target =
			( focusKey &&
				layout.querySelector< HTMLElement >(
					`[${ FOCUS_KEY_ATTRIBUTE }="${ CSS.escape( focusKey ) }"]`
				) ) ||
			layout.querySelector< HTMLElement >(
				`.${ styles.stage } [role="region"]`
			);

		target?.focus();
	}, [ href, layoutRef ] );
}
