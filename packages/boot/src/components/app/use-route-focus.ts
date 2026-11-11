import { useEffect, type RefObject } from '@wordpress/element';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { unlock } from '../../lock-unlock';
import styles from '../root/style.module.scss';

const { useRouter } = unlock( routePrivateApis );

/**
 * Hook that moves focus to the new page when a navigation removes the focused
 * element, such as a breadcrumb link that becomes the new page's heading.
 * Otherwise focus falls back to the document body, and keyboard and screen
 * reader users lose their place.
 *
 * @param layoutRef Ref to the layout element that contains the stage.
 */
export default function useRouteFocus(
	layoutRef: RefObject< HTMLElement | null >
) {
	const router = useRouter();

	useEffect(
		() =>
			// TanStack Router emits `onRendered` only when scroll restoration is
			// enabled, but `onResolved` also runs after the new route renders.
			router.subscribe(
				'onResolved',
				( { fromLocation }: { fromLocation?: unknown } ) => {
					const layout = layoutRef.current;

					// The initial page load has no previous location.
					if ( ! fromLocation || ! layout ) {
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
				}
			),
		[ router, layoutRef ]
	);
}
