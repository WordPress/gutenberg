/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';
import Editable from '../../editable';

const { children, query } = hpq;

registerBlock( 'core/table', {
	title: wp.i18n.__( 'Table' ),
	icon: 'editor-table',
	category: 'common',

	attributes: {
		rows: query( 'tr', query( 'td', children() ) ),
	},

	controls: [

	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { rows = [] } = attributes;
		const focussedKey = focus ? focus.editable || '0.0' : null;

		return (
			<table className="blocks-table">
				<tbody>
					{ rows.map( ( cells = [], i ) =>
						<tr key={ i }>
							{ cells.map( ( value, ii ) => {
								const key = i + '.' + ii;

								return (
									<td key={ key }>
										<Editable
											value={ value }
											focus={ focussedKey === key ? focus : null }
											onFocus={ () => setFocus( { editable: key } ) }
											onChange={ ( nextValue ) => {
												const nextRows = [ ...rows ];

												nextRows[ i ][ ii ] = nextValue;

												setAttributes( { rows: nextRows } );
											} }
											inline
										/>
									</td>
								);
							} ) }
						</tr>
					) }
				</tbody>
			</table>
		);
	},

	save( { attributes } ) {
		const { rows = [] } = attributes;

		return (
			<table>
				<tbody>
					{ rows.map( ( cells = [], i ) =>
						<tr key={ i }>
							{ cells.map( ( value, ii ) =>
								<td key={ ii }>{ value }</td>
							) }
						</tr>
					) }
				</tbody>
			</table>
		);
	},
} );
