import { useEffect, useRef, type RefObject } from '@wordpress/element';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { unlock } from '../../lock-unlock';
import styles from '../root/style.module.scss';

const { useRouterState } = unlock( routePrivateApis );

/**
 * Hook that moves focus to the new page when a navigation removes the focused
 * element, such as a breadcrumb link that becomes the new page's heading.
 * Otherwise focus falls back to the document body, and keyboard and screen
 * reader users lose their place.
 *
 * It runs in an effect after the route resolves. Effects of the page content
 * run before it, so the page can move focus itself first.
 *
 * @param layoutRef Ref to the layout element that contains the stage.
 */
export default function useRouteFocus(
	layoutRef: RefObject< HTMLElement | null >
) {
	const href: string | undefined = useRouterState( {
		select: ( state: { resolvedLocation?: { href: string } } ) =>
			state.resolvedLocation?.href,
	} );
	const previousHrefRef = useRef( href );

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

		layout
			.querySelector< HTMLElement >(
				`.${ styles.stage } [role="region"]`
			)
			?.focus();
	}, [ href, layoutRef ] );
}
