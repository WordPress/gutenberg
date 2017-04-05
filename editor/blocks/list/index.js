import AlignmentToolbar from '../../../controls/alignment-toolbar';
/**
 * External dependencies
 */
import { connect } from 'react-redux';

const Editable = wp.blocks.Editable;
const { html, prop } = wp.blocks.query;

function List( { nodeName, children } ) {
	// nodeName.toLowerCase() is used to map DOM nodeName values to proper tag.
	return wp.element.createElement( nodeName.toLowerCase(), null, children );
}

const ListBlock = ( { attributes, uid, onChange, onFocus } ) => {
	const { listType = 'ol', items = [] } = attributes;
	const value = items.map( i => {
		return `<li>${ i.value }</li>`;
	} ).join( '' );

	return (
		<div style={{border: '3px solid orange'}} onFocus={ onFocus } >
			<AlignmentToolbar />
			<Editable
				nodeName={ listType }
				value={ value }
				onChange={ onChange } />
		</div>
	)
}

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

	edit(props) { return <FocusListBlock {...props} /> },

	save( { attributes } ) {
		const { listType = 'ol', items = [] } = attributes;
		const children = items.map( ( i, index ) => <li key={ index }>{ i.value }</li> );
		return <List nodeName={ listType }>{ children }</List>;
	}
} );

const FocusListBlock = connect(
	( state, ownProps ) => ( {
		block: state.blocks.byUid[ ownProps.uid ]
	} ),
	( dispatch, ownProps ) => ( {
		onFocus( e ) {
			dispatch( {
				type: 'ACTIVE_BLOCK',
				uid: ownProps.uid
			} );
		}
	} )
)( ListBlock );
