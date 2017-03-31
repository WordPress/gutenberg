const Editable = wp.blocks.Editable;
const { html, prop } = wp.blocks.query;

function List( { nodeName, children } ) {
	// nodeName.toLowerCase() is used to map DOM nodeName values to proper tag.
	return wp.element.createElement( nodeName.toLowerCase(), null, children );
}

wp.blocks.registerBlock( 'core/list', {
	title: 'List',
	icon: 'list',
	category: 'common',

	attributes: {
	  listType: prop( 'ol,ul', 'nodeName' ),
		items: wp.blocks.query.query(
			'li',
			{
				value: html()
			}
		)
	},

	edit( attributes, onChange ) {
	  const { listType = 'ol', items=[] } = attributes;
	  const value = items.map( i => {
		  return `<li>${i.value}</li>`
	  }).join('')


	  return (
		<Editable
			nodeName={ listType }
			value={ value }
			onChange ={ onChange } />
	  );
	},

	save( attributes ) {
		const { listType = 'ol', items = [ ] } = attributes;
		const children = items.map((i, index) => <li key={index}>{i.value}</li>);
		return <List nodeName={listType}>{children}</List>
	}
} );

