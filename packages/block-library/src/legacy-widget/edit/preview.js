/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { useState } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Preview( { idBase, instance, isVisible } ) {
	const [ iframeHeight, setIframeHeight ] = useState( null );
	return (
		<>
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
						onLoad={ ( event ) => {
							setIframeHeight(
								event.target.contentDocument.body.scrollHeight
							);
						} }
					/>
				</Disabled>
			</div>
		</>
	);
}
