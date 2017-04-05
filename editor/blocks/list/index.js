import AlignmentToolbar from '../../../controls/alignment-toolbar';
import AbsolutePosition from './AbsolutePosition';
/**
 * External dependencies
 */
import Portal from 'react-portal';

const Editable = wp.blocks.Editable;
const { html, prop } = wp.blocks.query;

function List( { nodeName, children } ) {
	// nodeName.toLowerCase() is used to map DOM nodeName values to proper tag.
	return wp.element.createElement( nodeName.toLowerCase(), null, children );
}

const ListBlock = ( { attributes, onChange, isActive } ) => {
	const { listType = 'ol', items = [] } = attributes;
	let editRef = null;
	function position() {
		const pos = editRef && editRef.getBoundingClientRect();
		return pos;
	}
	// console.log( '>List render', isActive, editRef, 'pos:', position() );

	const value = items.map( i => {
		return `<li>${ i.value }</li>`;
	} ).join( '' );

	return (
		<div ref={ ( el ) => {
			editRef = el;
		} } style={ { border: '3px solid orange' } } >
			<Editable
				nodeName={ listType }
				value={ value }
				onChange={ onChange } />
			<Portal isOpened={ isActive } >
				<AbsolutePosition top={ position() && position().top } left={ 100 }  extraStyles={ { width: 500, border: '1px solid red' } } >
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
		return <ListBlock { ...props } />;
	},

	save( { attributes } ) {
		const { listType = 'ol', items = [] } = attributes;
		const children = items.map( ( i, index ) => <li key={ index }>{i.value}</li> );
		return <List nodeName={ listType }>{children}</List>;
	}
} );
