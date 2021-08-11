/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';
import { useState } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Preview( { idBase, instance, isVisible } ) {
	const [ isLoaded, setIsLoaded ] = useState( false );

	// Resize the iframe on either the load event, or when the iframe becomes visible.
	const ref = useRefEffect(
		( iframe ) => {
			// Only set height if the iframe is loaded,
			// or it will grow to an unexpected large height in Safari if it's hidden initially.
			if ( isLoaded ) {
				// If the preview frame has another origin then this won't work.
				// One possible solution is to add custom script to call `postMessage` in the preview frame.
				// Or, better yet, we migrate away from iframe.
				function setHeight() {
					// Pick the maximum of these two values to account for margin collapsing.
					const height = Math.max(
						iframe.contentDocument.documentElement.offsetHeight,
						iframe.contentDocument.body.offsetHeight
					);
					iframe.style.height = `${ height }px`;
				}

				const {
					IntersectionObserver,
				} = iframe.ownerDocument.defaultView;

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
			}
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
				className={ classnames(
					'wp-block-legacy-widget__edit-preview',
					{
						'is-offscreen': ! isVisible || ! isLoaded,
					}
				) }
			>
				<Disabled>
					{ /*
					We use an iframe so that the widget has an opportunity to
					load scripts and styles that it needs to run.
					*/ }
					<iframe
						ref={ ref }
						className="wp-block-legacy-widget__edit-preview-iframe"
						title={ __( 'Legacy Widget Preview' ) }
						// TODO: This chokes when the query param is too big.
						// Ideally, we'd render a <ServerSideRender>. Maybe by
						// rendering one in an iframe via a portal.
						src={ addQueryArgs( 'widgets.php', {
							'legacy-widget-preview': {
								idBase,
								instance,
							},
						} ) }
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
