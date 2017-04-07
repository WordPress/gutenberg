const Editable = wp.blocks.Editable;
const { html, prop } = wp.blocks.query;

wp.blocks.registerBlock( 'core/list', {
	title: wp.i18n.__( 'List' ),
	icon: 'editor-ul',
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

	edit( { attributes, onChange } ) {
		const { listType = 'ol', items = [] } = attributes;
		const value = items.map( item => {
			return `<li>${ item.value }</li>`;
		} ).join( '' );

		return (
			<Editable
				tagName={ listType }
				value={ value }
				onChange={ onChange } />
		);
	},

	save( { attributes } ) {
		const { listType = 'ol', items = [] } = attributes;
		const children = items.map( ( item, index ) => (
			<li key={ index } dangerouslySetInnerHTML={ { __html: item.value } } />
		) );
		return wp.element.createElement( listType.toLowerCase(), null, children );
	}
} );
