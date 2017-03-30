const Editable = wp.blocks.Editable;
const { html, prop } = wp.blocks.query;

function List( { nodeName = 'ol', children } ) {
	// nodeName.toLowerCase() is used to map DOM nodeName values to proper tag.
	return wp.element.createElement( nodeName.toLowerCase(), null, children );
}

wp.blocks.registerBlock( 'core/list', {
	title: 'List',
	icon: 'list',
	category: 'common',

	attributes: {
	  value: html( 'ol,ul' ),
	  listType: prop( 'ol,ul', 'nodeName' )
	},

	edit( attributes, onChange ) {
	  const { listType = 'ol', items } = attributes;
	  const lis = items.map( i => {
		  return `<li>${i}</li>`
	  })


	  return (
		<Editable
			nodeName={ listType }
			value={ lis.join('') }
			onChange={ ( nextValue ) => onChange( { value: nextValue } ) } />
	  );
	},

	save( attributes ) {
	  const { listType = 'ol', value } = attributes;
      return <List nodeName={listType}>{value}</List>
	}
} );