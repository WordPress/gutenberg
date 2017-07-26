export default function( nodes ) {
	return nodes
	.filter( node => 'TABLE' !== node.nodeName )
	.map( node => {
		// TODO Remove junk <span>s
		return node;
	} );
}
