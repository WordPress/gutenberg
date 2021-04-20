/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { useRef, useState } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Preview( { idBase, instance, isVisible } ) {
	return (
		<div
			className="wp-block-legacy-widget__edit-preview"
			hidden={ ! isVisible }
		>
			<Disabled>
				<PreviewIframe
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
					placeholder={
						<Placeholder>
							<Spinner />
						</Placeholder>
					}
				/>
			</Disabled>
		</div>
	);
}

/**
 * Iframe used for rendering a preview of the widget.
 *
 * We use an iframe so that the widget has an opportunity to load scripts and
 * styles that it needs to run.
 *
 * The height of the iframe is set dynamically by looking at the scrollHeight of
 * the iframe contents once it is finished loading.
 *
 * While the iframe contents are loading, we move the iframe off-screen and
 * display a placeholder instead. This ensures that the user doesn't see the
 * iframe resize (which looks really janky). We have to move the iframe
 * off-screen instead of hiding it because web browsers will not trigger onLoad
 * if the iframe is hidden.
 *
 * @param {Object} props
 * @param {string} props.className
 * @param {string} props.title
 * @param {number} props.height
 * @param {WPElement} props.placeholder
 */
function PreviewIframe( {
	className,
	title,
	height: defaultHeight = 10,
	placeholder,
	...props
} ) {
	const ref = useRef();
	const [ height, setHeight ] = useState( null );
	return (
		<>
			{ height === null && placeholder }
			<iframe
				{ ...props }
				ref={ ref }
				className={ classnames( className, {
					'is-offscreen': height === null,
				} ) }
				title={ title }
				height={ height ?? defaultHeight }
				onLoad={ () => {
					setHeight( ref.current.contentDocument.body.scrollHeight );
				} }
			/>
		</>
	);
}
