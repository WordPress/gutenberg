/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { Disabled, FocusableIframe } from '@wordpress/components';
import { useState } from '@wordpress/element';

function WidgetPreview( { widgetAreaId, attributes, ...props } ) {
	const DEFAULT_HEIGHT = 300;
	const HEIGHT_MARGIN = 20;
	const [ height, setHeight ] = useState( DEFAULT_HEIGHT );
	const currentUrl = document.location.href;
	const siteUrl = currentUrl.substr( 0, currentUrl.indexOf( 'wp-admin/' ) );
	const iframeUrl = addQueryArgs( siteUrl, {
		widgetPreview: {
			...attributes,
			sidebarId: widgetAreaId,
		},
	} );
	return (
		<Disabled>
			<FocusableIframe
				onLoad={ ( event ) => {
					const iframeContentHeight = get( event, [
						'currentTarget',
						'contentDocument',
						'body',
						'scrollHeight',
					] );
					if ( iframeContentHeight !== height ) {
						setHeight( iframeContentHeight );
					}
				} }
				src={ iframeUrl }
				height={ height + HEIGHT_MARGIN }
				{ ...props }
			/>
		</Disabled>
	);
}

export default WidgetPreview;
