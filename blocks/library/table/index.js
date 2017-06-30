/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { createElement } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query as hpq } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const { children, query } = hpq;

registerBlockType( 'core/table', {
	title: __( 'Table' ),
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

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const focussedKey = focus ? focus.editable || 'body.0.0' : null;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );

		return [
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ attributes.align }
						onChange={ updateAlignment }
						controls={ [ 'left', 'center', 'right', 'wide' ] }
					/>
				</BlockControls>
			),
			<table key="table" className={ className }>
				{ [ 'head', 'body', 'foot' ].map( ( part ) =>
					attributes[ part ] && attributes[ part ].length
						? createElement( 't' + part, { key: part },
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
													onFocus={ ( props ) => setFocus( { ...props, editable: key } ) }
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
			</table>,
		];
	},

	save( { attributes } ) {
		return (
			<table>
				{ [ 'head', 'body', 'foot' ].map( ( part ) =>
					attributes[ part ] && attributes[ part ].length
						? createElement( 't' + part, { key: part },
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
