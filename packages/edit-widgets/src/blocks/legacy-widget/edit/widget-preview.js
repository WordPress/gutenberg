/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { Disabled, FocusableIframe } from '@wordpress/components';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';

function WidgetPreview( { widgetAreaId, attributes, hidden, ...props } ) {
	const DEFAULT_HEIGHT = 300;
	const HEIGHT_MARGIN = 20;
	const [ height, setHeight ] = useState( DEFAULT_HEIGHT );
	const iframeRef = useRef();
	const currentUrl = document.location.href;
	const iframeUrl = addQueryArgs( currentUrl, {
		'widget-preview': {
			...attributes,
			sidebarId: widgetAreaId,
		},
	} );

	const resetIframeHeight = useCallback( () => {
		setHeight(
			get( iframeRef.current, [
				'contentDocument',
				'body',
				'scrollHeight',
			] )
		);
	}, [] );

	// Reset the iframe height after the component is not hidden anymore.
	// If the component is still in the hidden state, scrollHeight will always be 0.
	useEffect( () => {
		if ( ! hidden ) {
			resetIframeHeight();
		}
	}, [ hidden, resetIframeHeight ] );

	return (
		<Disabled hidden={ hidden }>
			<FocusableIframe
				onLoad={ () => {
					resetIframeHeight();
				} }
				src={ iframeUrl }
				height={ height + HEIGHT_MARGIN }
				iframeRef={ iframeRef }
				{ ...props }
			/>
		</Disabled>
	);
}

export default WidgetPreview;
