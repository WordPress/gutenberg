/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

export default function useNavigateToEntityRecord() {
	const history = useHistory();

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Capture current scroll position before navigating
			const iframe = document.querySelector(
				'iframe[name="editor-canvas"]'
			);
			const iframeDocument =
				iframe?.contentDocument || iframe?.contentWindow?.document;
			const scrollElement = iframeDocument?.documentElement;

			const currentScrollPosition = scrollElement
				? { x: scrollElement.scrollLeft, y: scrollElement.scrollTop }
				: { x: window.scrollX, y: window.scrollY };

			// Store scroll position for current location
			const currentPath =
				window.location.pathname + window.location.search;
			window.sessionStorage?.setItem(
				`gutenberg_scroll_${ currentPath }`,
				JSON.stringify( currentScrollPosition )
			);

			history.navigate(
				`/${ params.postType }/${ params.postId }?canvas=edit&focusMode=true`
			);
		},
		[ history ]
	);

	return onNavigateToEntityRecord;
}

export function useRestoreScrollPosition() {
	const location = useLocation();

	useEffect( () => {
		// Restore scroll position when location changes
		const currentPath = window.location.pathname + window.location.search;
		const storedPosition = window.sessionStorage?.getItem(
			`gutenberg_scroll_${ currentPath }`
		);

		if ( storedPosition && typeof window !== 'undefined' ) {
			const scrollPosition = JSON.parse( storedPosition );

			const restoreScroll = () => {
				const iframe = document.querySelector(
					'iframe[name="editor-canvas"]'
				);
				const iframeWindow = iframe?.contentWindow;

				if ( iframeWindow ) {
					setTimeout( () => {
						iframeWindow.scrollTo(
							scrollPosition.x,
							scrollPosition.y
						);
					}, 100 );
				} else {
					window.scrollTo( scrollPosition.x, scrollPosition.y );
				}
			};

			if ( typeof window.requestAnimationFrame !== 'undefined' ) {
				window.requestAnimationFrame( restoreScroll );
			} else {
				restoreScroll();
			}
		}
	}, [ location ] );
}
