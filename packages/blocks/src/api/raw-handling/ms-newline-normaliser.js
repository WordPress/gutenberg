export default function( node ) {
	if ( node.nodeName !== 'P' ) {
		return;
	}

	if ( ! [ ...node.classList ].find( ( className ) => className.match( /^Mso[A-Z].*/ ) ) ) {
		return;
	}

	node.innerHTML = node.innerHTML.replace( /(?<!<br>)\n/g, ' ' );
}
