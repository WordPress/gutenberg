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
	const [ iframeHeight, setIframeHeight ] = useState();

	// Resize the iframe on either the load event, or when the iframe becomes visible.
	const ref = useRefEffect( ( iframe ) => {
		function onChange() {
			const boundingRect = iframe?.contentDocument?.body?.getBoundingClientRect();
			if ( boundingRect ) {
				// Include `top` in the height calculation to avoid the bottom
				// of widget previews being cut-off. Most widgets have a
				// heading at the top that has top margin, and the `height`
				// alone doesn't take that margin into account.
				setIframeHeight( boundingRect.top + boundingRect.height );
			}
		}

		const { IntersectionObserver } = iframe.ownerDocument.defaultView;

		// Observe for intersections that might cause a change in the height of
		// the iframe, e.g. a Widget Area becoming expanded.
		const intersectionObserver = new IntersectionObserver( onChange, {
			threshold: 1,
		} );
		intersectionObserver.observe( iframe );

		iframe.addEventListener( 'load', onChange );

		return () => {
			iframe.removeEventListener( 'load', onChange );
		};
	}, [] );

	return (
		<>
			{ /*
			While the iframe contents are loading, we move the iframe off-screen
			and display a placeholder instead. This ensures that the user
			doesn't see the iframe resize (which looks really janky). We have to
			move the iframe off-screen instead of hiding it because web browsers
			will not trigger onLoad if the iframe is hidden.
			*/ }
			{ isVisible && iframeHeight === null && (
				<Placeholder>
					<Spinner />
				</Placeholder>
			) }
			<div
				className={ classnames(
					'wp-block-legacy-widget__edit-preview',
					{
						'is-offscreen': ! isVisible || iframeHeight === null,
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
						height={ iframeHeight || 100 }
					/>
				</Disabled>
			</div>
		</>
	);
}
