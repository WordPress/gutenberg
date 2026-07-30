/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { Disabled, Placeholder, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

export default function Preview( { idBase, instance, isVisible } ) {
	const [ isLoaded, setIsLoaded ] = useState( false );
	const [ srcDoc, setSrcDoc ] = useState( '' );

	useEffect( () => {
		const abortController =
			typeof window.AbortController === 'undefined'
				? undefined
				: new window.AbortController();

		async function fetchPreviewHTML() {
			const restRoute = `/wp/v2/widget-types/${ idBase }/render`;
			return await apiFetch( {
				path: restRoute,
				method: 'POST',
				signal: abortController?.signal,
				data: instance ? { instance } : {},
			} );
		}

		fetchPreviewHTML()
			.then( ( response ) => {
				setSrcDoc( response.preview );
			} )
			.catch( ( error ) => {
				if ( 'AbortError' === error.name ) {
					// We don't want to log aborted requests.
					return;
				}
				throw error;
			} );

		return () => abortController?.abort();
	}, [ idBase, instance ] );

	// Resize the iframe on either the load event, or when the iframe becomes visible.
	const ref = useRefEffect(
		( iframe ) => {
			// Only set height if the iframe is loaded,
			// or it will grow to an unexpected large height in Safari if it's hidden initially.
			if ( ! isLoaded ) {
				return;
			}
			// If the preview frame has another origin then this won't work.
			// One possible solution is to add custom script to call `postMessage` in the preview frame.
			// Or, better yet, we migrate away from iframe.
			function setHeight() {
				// Pick the maximum of these two values to account for margin collapsing.
				const height = Math.max(
					iframe.contentDocument.documentElement?.offsetHeight ?? 0,
					iframe.contentDocument.body?.offsetHeight ?? 0
				);

				// Fallback to a height of 100px if the height cannot be determined.
				// This ensures the block is still selectable. 100px should hopefully
				// be not so big that it's annoying, and not so small that nothing
				// can be seen.
				iframe.style.height = `${ height !== 0 ? height : 100 }px`;
			}

			const { IntersectionObserver } = iframe.ownerDocument.defaultView;

			// Observe for intersections that might cause a change in the height of
			// the iframe, e.g. a Widget Area becoming expanded.
			const intersectionObserver = new IntersectionObserver(
				( [ entry ] ) => {
					if ( entry.isIntersecting ) {
						setHeight();
					}
				},
				{
					threshold: 1,
				}
			);
			intersectionObserver.observe( iframe );

			iframe.addEventListener( 'load', setHeight );

			return () => {
				intersectionObserver.disconnect();
				iframe.removeEventListener( 'load', setHeight );
			};
		},
		[ isLoaded ]
	);

	return (
		<>
			{ /*
			While the iframe contents are loading, we move the iframe off-screen
			and display a placeholder instead. This ensures that the user
			doesn't see the iframe resize (which looks really janky). We have to
			move the iframe off-screen instead of hiding it because web browsers
			will not trigger onLoad if the iframe is hidden.
			*/ }
			{ isVisible && ! isLoaded && (
				<Placeholder>
					<Spinner />
				</Placeholder>
			) }
			<div
				className={ clsx( 'wp-block-legacy-widget__edit-preview', {
					'is-offscreen': ! isVisible || ! isLoaded,
				} ) }
			>
				<Disabled>
					{ /*
					We use an iframe so that the widget has an opportunity to
					load scripts and styles that it needs to run.
					*/ }
					<iframe
						ref={ ref }
						className="wp-block-legacy-widget__edit-preview-iframe"
						tabIndex="-1"
						title={ __( 'Legacy Widget Preview' ) }
						srcDoc={ srcDoc }
						onLoad={ ( event ) => {
							// To hide the scrollbars of the preview frame for some edge cases,
							// such as negative margins in the Gallery Legacy Widget.
							// It can't be scrolled anyway.
							// TODO: Ideally, this should be fixed in core.
							event.target.contentDocument.body.style.overflow =
								'hidden';

							setIsLoaded( true );
						} }
						height={ 100 }
					/>
				</Disabled>
			</div>
		</>
	);
}
