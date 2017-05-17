/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';
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

registerBlock( 'core/table', {
	title: wp.i18n.__( 'Table' ),
	icon: 'editor-table',
	category: 'common',

	attributes: {
		rows: query( 'tr', query( 'td', children() ) ),
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
		const { rows = [] } = attributes;
		const focussedKey = focus ? focus.editable || '0.0' : null;

		return (
			<table>
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
