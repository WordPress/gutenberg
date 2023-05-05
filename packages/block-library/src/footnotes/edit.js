/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Fragment, useState } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { Slot } from './slot-fill';

export default function FootnotesEdit() {
	const [ order, setOrder ] = useState( [] );
	const ref = useRefEffect( ( element ) => {
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;
		const config = { childList: true, subtree: true };
		const observer = new defaultView.MutationObserver( () => {
			const newOrder = Array.from(
				ownerDocument.querySelectorAll( 'a.note-link' )
			).map( ( node ) => {
				return node.getAttribute( 'href' ).slice( 1 );
			} );
			setOrder( ( state ) =>
				state.join( '' ) === newOrder.join( '' ) ? state : newOrder
			);
		} );

		observer.observe( ownerDocument, config );
		return () => {
			observer.disconnect();
		};
	}, [] );
	return (
		<footer { ...useBlockProps( { ref } ) }>
			<ol>
				<Slot>
					{ ( fills ) => {
						const flat = fills.flat().sort( ( a, b ) => {
							const aId = a.props.id;
							const bId = b.props.id;
							const aIndex = order.indexOf( aId );
							if ( aIndex === -1 ) {
								return 1;
							}
							const bIndex = order.indexOf( bId );
							if ( bIndex === -1 ) {
								return -1;
							}
							return aIndex - bIndex;
						} );
						return flat.map( ( fill ) => (
							<Fragment key={ fill.props.id }>{ fill }</Fragment>
						) );
					} }
				</Slot>
			</ol>
		</footer>
	);
}
