/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

function addManifest( manifest ) {
	const link = document.createElement( 'link' );
	link.rel = 'manifest';
	link.href = `data:application/manifest+json,${ encodeURIComponent(
		JSON.stringify( manifest )
	) }`;
	document.head.appendChild( link );
}

function addAppleTouchIcon( size, base64data ) {
	const iconLink = document.createElement( 'link' );
	iconLink.rel = 'apple-touch-icon';
	iconLink.href = base64data;
	iconLink.sizes = '180x180';
	document.head.insertBefore( iconLink, document.head.firstElementChild );
}

function createSvgElement( html ) {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;
	const { firstElementChild: svgElement } = doc.body;
	svgElement.setAttribute( 'viewBox', '0 0 80 80' );
	return svgElement;
}

function createIcon( { svgElement, size, color, backgroundColor, circle } ) {
	return new Promise( ( resolve ) => {
		const canvas = document.createElement( 'canvas' );
		const context = canvas.getContext( '2d' );

		// Leave 1/8th padding around the logo.
		const padding = size / 8;
		// Which leaves 3/4ths of space for the icon.
		const logoSize = padding * 6;

		// Resize the SVG logo.
		svgElement.setAttribute( 'width', logoSize );
		svgElement.setAttribute( 'height', logoSize );

		// Color in the background.
		svgElement.querySelectorAll( 'path' ).forEach( ( path ) => {
			path.setAttribute( 'fill', backgroundColor );
		} );

		// Resize the canvas.
		canvas.width = size;
		canvas.height = size;

		// If we're not drawing a circle, set the background color.
		if ( ! circle ) {
			context.fillStyle = backgroundColor;
			context.fillRect( 0, 0, canvas.width, canvas.height );
		}

		// Fill in the letter (W) and circle around it.
		context.fillStyle = color;
		context.beginPath();
		context.arc( size / 2, size / 2, logoSize / 2 - 1, 0, 2 * Math.PI );
		context.closePath();
		context.fill();

		// Create a URL for the SVG to load in an image element.
		const svgBlob = new window.Blob( [ svgElement.outerHTML ], {
			type: 'image/svg+xml',
		} );
		const url = URL.createObjectURL( svgBlob );
		const image = document.createElement( 'img' );

		image.src = url;
		image.width = logoSize;
		image.height = logoSize;
		image.onload = () => {
			// Once the image is loaded, draw it onto the canvas.
			context.drawImage( image, padding, padding );
			// Export it to a blob.
			canvas.toBlob( ( imageBlob ) => {
				// We no longer need the SVG blob url.
				URL.revokeObjectURL( url );
				// Unfortunately blob URLs don't seem to work, so we have to use
				// base64 encoded data URLs.
				const reader = new window.FileReader();
				reader.readAsDataURL( imageBlob );
				reader.onloadend = () => {
					resolve( reader.result );
				};
			} );
		};
	} );
}

function getAdminBarColors() {
	const adminBarDummy = document.createElement( 'div' );
	adminBarDummy.id = 'wpadminbar';
	document.body.appendChild( adminBarDummy );
	const { color, backgroundColor } = window.getComputedStyle( adminBarDummy );
	document.body.removeChild( adminBarDummy );
	// Fall back to black and white if no admin/color stylesheet was loaded.
	return {
		color: color || 'white',
		backgroundColor: backgroundColor || 'black',
	};
}

window.addEventListener( 'load', () => {
	if ( ! ( 'serviceWorker' in window.navigator ) ) {
		return;
	}

	const { logo, siteTitle, adminUrl } = window.wpAdminManifestL10n;
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

	const { color, backgroundColor } = getAdminBarColors();
	const svgElement = createSvgElement( logo );

	Promise.all( [
		// The maskable icon should have its background filled. This is used
		// for iOS. To do: check which sizes are really needed.
		...[ 180, 192, 512 ].map( ( size ) =>
			createIcon( {
				svgElement,
				size,
				color,
				backgroundColor,
			} ).then( ( base64data ) => {
				manifest.icons.push( {
					src: base64data,
					sizes: size + 'x' + size,
					type: 'image/png',
					purpose: 'maskable',
				} );

				// iOS doesn't seem to look at the manifest.
				if ( size === 180 ) {
					addAppleTouchIcon( size, base64data );
				}
			} )
		),
		// The "normal" icon should be round. This is used for Chrome
		// Desktop PWAs. To do: check which sizes are really needed.
		...[ 180, 192, 512 ].map( ( size ) =>
			createIcon( {
				svgElement,
				size,
				color,
				backgroundColor,
				circle: true,
			} ).then( ( base64data ) => {
				manifest.icons.push( {
					src: base64data,
					sizes: size + 'x' + size,
					type: 'image/png',
					purpose: 'any',
				} );
			} )
		),
	] ).then( () => {
		addManifest( manifest );
		window.navigator.serviceWorker.register(
			addQueryArgs( adminUrl, { 'service-worker': true } )
		);
	} );
} );
