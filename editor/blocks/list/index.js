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

const ListBlock = ( { attributes, onChange, onFocus } ) => {
	const { listType = 'ol', items = [] } = attributes;
	let editRef = null;
	function position() {
		const pos = editRef && editRef.getBoundingClientRect();
		console.log( '>REF', editRef, pos );
		return pos;
	}

	const value = items.map( i => {
		return `<li>${ i.value }</li>`;
	} ).join( '' );

	return (
		<div ref={ ( el ) => {
			editRef = el;
		} } style={ { border: '3px solid orange' } } onFocus={ onFocus } >
			<Editable
				nodeName={ listType }
				value={ value }
				onChange={ onChange } />
			<Portal isOpened={ true } isOpen={ true } >
				<AbsolutePosition top={ position() && position().top } left={ 100 } extraStyles={ { width: 500, border: '1px solid red' } } >
					<button onClick={ position }> MM </button>
					<AlignmentToolbar />
				</AbsolutePosition>
			</Portal>
		</div>
	);
};

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
		return <FocusListBlock { ...props } />;
	},

	save( { attributes } ) {
		const { listType = 'ol', items = [] } = attributes;
		const children = items.map( ( i, index ) => <li key={ index }>{i.value}</li> );
		return <List nodeName={ listType }>{children}</List>;
	}
} );

const mapStateToProps = ( state, ownProps ) => ( {
	block: state.blocks.byUid[ ownProps.uid ],
	isActive: ownProps.uid === state.activeUid
} );

const mapDispatchToProps = ( dispatch, ownProps ) => ( {
	onFocus( ) {
		dispatch( {
			type: 'ACTIVE_BLOCK',
			uid: ownProps.uid
		} );
	}
} );

const FocusListBlock = connect( mapStateToProps, mapDispatchToProps )( ListBlock );
