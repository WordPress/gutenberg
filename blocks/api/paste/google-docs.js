function run( nodes ) {
	return nodes.filter( node => {
		return 'TABLE' !== node.nodeName;
	} );
}

export default {
	test: () => true,
	run,
};
