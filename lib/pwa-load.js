/* global scriptVars */

function addManifest( manifest ) {
	const link = document.createElement( 'link' );
	link.rel = 'manifest';
	link.href = 'data:application/manifest+json,' + JSON.stringify( manifest );
	document.head.appendChild( link );
}

function createSvgElement( html ) {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;
	const { firstElementChild: svgElement } = doc.body;
	svgElement.setAttribute( 'viewBox', '0 0 80 80' );
	return svgElement;
}

function createIcon( svgElement, size, backgroundColor ) {
	return new Promise( ( resolve ) => {
		// https://w3c.github.io/manifest/#icon-masks
		const padding = size / 8;
		const logoSize = padding * 6;
		const canvas = document.createElement( 'canvas' );
		const context = canvas.getContext( '2d' );

		svgElement.setAttribute( 'width', logoSize );
		svgElement.setAttribute( 'height', logoSize );
		canvas.width = size;
		canvas.height = size;
		context.fillStyle = backgroundColor;
		context.fillRect( 0, 0, canvas.width, canvas.height );

		const blob = new window.Blob( [ svgElement.outerHTML ], {
			type: 'image/svg+xml',
		} );
		const url = URL.createObjectURL( blob );
		const image = document.createElement( 'img' );
		image.src = url;
		image.width = logoSize;
		image.height = logoSize;
		image.onload = () => {
			context.drawImage( image, padding, padding );
			canvas.toBlob( ( bb ) => {
				// URL.revokeObjectURL( url );
				const reader = new window.FileReader();
				reader.readAsDataURL( bb );
				reader.onloadend = function () {
					resolve( reader.result );
				};
			} );
		};
	} );
}

if ( 'serviceWorker' in window.navigator ) {
	// eslint-disable-next-line @wordpress/no-global-event-listener
	window.addEventListener( 'load', function () {
		const { serviceWorkerUrl, logo, siteTitle, adminUrl } = scriptVars;
		const manifest = {
			name: siteTitle,
			display: 'standalone',
			orientation: 'portrait',
			start_url: adminUrl,
			// Open front-end, login page, and any external URLs in a browser
			// modal.
			scope: adminUrl,
			icons: [],
		};

		window.navigator.serviceWorker.register( serviceWorkerUrl );

		const adminBar = document.getElementById( 'wpadminbar' );
		const { backgroundColor } = window.getComputedStyle( adminBar );
		const svgElement = createSvgElement( logo );

		function addToManifest( base64data ) {
			manifest.icons.push( {
				src: base64data,
				sizes: '192x192',
				type: 'image/png',
			} );
		}

		createIcon( svgElement, 180, backgroundColor ).then( ( base64data ) => {
			const iconLink = document.createElement( 'link' );
			iconLink.rel = 'apple-touch-icon';
			iconLink.href = base64data;
			iconLink.sizes = '180x180';
			document.head.insertBefore(
				iconLink,
				document.head.firstElementChild
			);
			addToManifest( base64data );
		} );

		Promise.all( [
			createIcon( svgElement, 192, backgroundColor ).then(
				addToManifest
			),
			createIcon( svgElement, 512, backgroundColor ).then(
				addToManifest
			),
		] ).then( () => {
			addManifest( manifest );
		} );
	} );
}
