/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query as hpq } from '../../api';
import Editable from '../../editable';

const { children, query } = hpq;

/**
 * Returns an attribute setter with behavior that if the target value is
 * already the assigned attribute value, it will be set to undefined.
 *
 * @param  {string}   align Alignment value
 * @return {Function}       Attribute setter
 */
function toggleAlignment( align ) {
	return ( attributes, setAttributes ) => {
		const nextAlign = attributes.align === align ? undefined : align;
		setAttributes( { align: nextAlign } );
	};
}

registerBlockType( 'core/table', {
	title: wp.i18n.__( 'Table' ),
	icon: 'editor-table',
	category: 'formatting',

	attributes: {
		head: query( 'thead > tr', query( 'td,th', children() ) ),
		body: query( 'tbody > tr', query( 'td,th', children() ) ),
		foot: query( 'tfoot > tr', query( 'td,th', children() ) ),
	},

	defaultAttributes: {
		body: [ [ [], [] ], [ [], [] ] ],
	},

	controls: [
		{
			icon: 'align-left',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: toggleAlignment( 'left' ),
		},
		{
			icon: 'align-center',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => 'center' === align,
			onClick: toggleAlignment( 'center' ),
		},
		{
			icon: 'align-right',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick: toggleAlignment( 'right' ),
		},
		{
			icon: 'align-full-width',
			title: wp.i18n.__( 'Wide width' ),
			isActive: ( { align } ) => 'wide' === align,
			onClick: toggleAlignment( 'wide' ),
		},
	],

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const focussedKey = focus ? focus.editable || 'body.0.0' : null;

		return (
			<table>
				{ [ 'head', 'body', 'foot' ].map( ( part ) =>
					attributes[ part ] && attributes[ part ].length
						? wp.element.createElement( 't' + part, { key: part },
							attributes[ part ].map( ( rows = [], i ) =>
								<tr key={ i }>
									{ rows.map( ( value = '', ii ) => {
										const key = part + i + '.' + ii;
										const Cell = part === 'head' ? 'th' : 'td';

										return (
											<Cell key={ key }>
												<Editable
													inline
													value={ value }
													focus={ focussedKey === key ? focus : null }
													onFocus={ () => setFocus( { editable: key } ) }
													onChange={ ( nextValue ) => {
														const nextPart = [ ...attributes[ part ] ];

														nextPart[ i ][ ii ] = nextValue;

														setAttributes( { [ part ]: nextPart } );
													} }
												/>
											</Cell>
										);
									} ) }
								</tr>
							)
						)
						: null
				) }
			</table>
		);
	},

	save( { attributes } ) {
		return (
			<table>
				{ [ 'head', 'body', 'foot' ].map( ( part ) =>
					attributes[ part ] && attributes[ part ].length
						? wp.element.createElement( 't' + part, { key: part },
							attributes[ part ].map( ( rows = [], i ) =>
								<tr key={ i }>
									{ rows.map( ( value = '', ii ) => {
										const key = part + i + '.' + ii;
										const Cell = part === 'head' ? 'th' : 'td';

										return <Cell key={ key }>{ value }</Cell>;
									} ) }
								</tr>
							)
						)
						: null
				) }
			</table>
		);
	},
} );
