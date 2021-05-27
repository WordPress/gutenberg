/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { useEffect, useState } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Preview( { idBase, instance, isVisible } ) {
	const [ iframeHeight, setIframeHeight ] = useState();
	const [ iframeContentDocument, setIframeContentDocument ] = useState();

	useEffect( () => {
		const intervalId = setInterval( () => {
			if (
				iframeContentDocument &&
				iframeContentDocument.body.scrollHeight > 0
			) {
				setIframeHeight( iframeContentDocument.body.scrollHeight );
				clearInterval( intervalId );
			}
		}, 100 );

		return () => {
			clearInterval( intervalId );
		};
	}, [ iframeContentDocument ] );

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
						className="wp-block-legacy-widget__edit-preview-iframe"
						title={ __( 'Legacy Widget Preview' ) }
						// TODO: This chokes when the query param is too big.
						// Ideally, we'd render a <ServerSideRender>. Maybe by
						// rendering one in an iframe via a portal.
						src={ addQueryArgs( 'themes.php', {
							page: 'gutenberg-widgets',
							'legacy-widget-preview': {
								idBase,
								instance,
							},
						} ) }
						height={ iframeHeight ?? 100 }
						onLoad={ ( event ) => {
							setIframeContentDocument(
								event.target.contentDocument
							);
						} }
					/>
				</Disabled>
			</div>
		</>
	);
}
