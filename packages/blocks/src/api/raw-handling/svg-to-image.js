export default function svgToImage( node, doc ) {
	if ( node.nodeName !== 'svg' ) {
		return;
	}

	// Replace with image with data URL.
	const svgString = node.outerHTML;
	const img = doc.createElement( 'img' );
	img.src = 'data:image/svg+xml,' + encodeURIComponent( svgString );
	node.parentNode.replaceChild( img, node );
}
