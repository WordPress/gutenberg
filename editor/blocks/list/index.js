import AlignmentToolbar from '../../../controls/alignment-toolbar';
/**
 * External dependencies
 */
import Portal from 'react-portal';
import { connect } from 'react-redux';
import AbsolutePosition from './AbsolutePosition';

const Editable = wp.blocks.Editable;
const { html, prop } = wp.blocks.query;

function List( { nodeName, children } ) {
	// nodeName.toLowerCase() is used to map DOM nodeName values to proper tag.
	return wp.element.createElement( nodeName.toLowerCase(), null, children );
}

const ListBlock = ( { attributes, uid, onChange, onFocus } ) => {
	const { listType = 'ol', items = [] } = attributes;
		const editableComponent = null;
		function position() {
			let pos = editableComponent && editableComponent.getBoundingClientRect();
			console.log( 'POS:: ', refs.absolutePosition );
			return pos;
		}

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
				<Portal isOpened={ true } isOpen={ true } >
					<AbsolutePosition top={ position() && position().top } left={ 100 } extraStyles={ { width: 500, border: '1px solid red' } }
						ref="absolutePosition">
						<button onClick={ position }> MM </button>
						<AlignmentToolbar />
					</AbsolutePosition>
				</Portal>
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
