const Editable = wp.blocks.Editable;
const { html, prop } = wp.blocks.query;

function List( { nodeName = 'ul', children } ) {
	// nodeName.toLowerCase() is used to map DOM nodeName values to proper tag.
	return wp.element.createElement( nodeName.toLowerCase(), null, children );
}

wp.blocks.registerBlock( 'core/list', {
	title: 'List',
	icon: 'list',
	category: 'common',

	attributes: {
    //  wp.blocks.query ... work out what these should be.
		
	},

	edit( attributes, onChange ) {
    return <ol><li>List edit: Not implemented</li></ol>;
	},

	save( attributes ) {
		// Render a component
    return <ol><li>List save: Not implemented</li></ol>;
	}
} );