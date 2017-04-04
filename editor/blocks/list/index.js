import AlignmentToolbar from '../../../controls/alignment-toolbar';

const Editable = wp.blocks.Editable;
const { html, prop } = wp.blocks.query;

function List( { nodeName, children } ) {
	// nodeName.toLowerCase() is used to map DOM nodeName values to proper tag.
	return wp.element.createElement( nodeName.toLowerCase(), null, children );
}

	const	onFocus = (prop, attr) => ((e) => {
			console.log('f ', prop, attr, e.target);
		})

	const	onBlur = (prop, attr) => ((e) => {
			console.log('b ', prop, attr, e.target)
		})

wp.blocks.registerBlock( 'core/list', {
	title: 'List',
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

	edit( props ) {
		const { attributes, onChange, blockId } = props
		const { listType = 'ol', items = [] } = attributes;
		const value = items.map( i => {
			return `<li>${ i.value }</li>`;
		} ).join( '' );

		return (
 			<div style={{border: '3px solid orange'}} onFocus={ onFocus(props, attributes)} onBlur={ onBlur(props, attributes) }>
				<AlignmentToolbar />
				<Editable
					nodeName={ listType }
					value={ value }
					onChange={ onChange } />
			</div>
		);
	},

	save( { attributes } ) {
		const { listType = 'ol', items = [] } = attributes;
		const children = items.map( ( i, index ) => <li key={ index }>{ i.value }</li> );
		return <List nodeName={ listType }>{ children }</List>;
	}
} );
