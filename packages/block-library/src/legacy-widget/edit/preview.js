/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { useRef, useState, useCallback, useEffect } from '@wordpress/element';
import { Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DEFAULT_HEIGHT = 300;

export default function PreviewIframe( { idBase, instance, isVisible } ) {
	const ref = useRef();

	const [ height, setHeight ] = useState( DEFAULT_HEIGHT );

	const adjustHeight = useCallback( () => {
		setHeight( ref.current.contentDocument.body.scrollHeight );
	}, [] );

	useEffect( () => {
		if ( isVisible ) {
			adjustHeight();
		}
	}, [ isVisible, adjustHeight ] );

	return (
		<Disabled hidden={ ! isVisible }>
			{ /*
			Rendering the preview in an iframe ensures compatibility with any
			scripts that the widget uses. TODO: This chokes when the
			legacy-widget-preview query param is too big. Ideally, we'd render a
			<ServerSideRender> into an iframe using a portal.
			*/ }
			<iframe
				ref={ ref }
				className="wp-block-legacy-widget__edit-preview"
				src={ addQueryArgs( 'themes.php', {
					page: 'gutenberg-widgets',
					'legacy-widget-preview': {
						idBase,
						instance,
					},
				} ) }
				title={ __( 'Legacy Widget Preview' ) }
				height={ height }
				onLoad={ adjustHeight }
			/>
		</Disabled>
	);
}
