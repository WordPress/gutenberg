/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';
import TableBlock from './table-block';

const { children } = hpq;

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

registerBlock( 'core/table2', {
	title: wp.i18n.__( 'Table2' ),
	icon: 'editor-table',
	category: 'common',

	attributes: {
		content: children( 'table' ),
	},

	defaultAttributes: {
		content: [
			<tbody key="1">
				<tr><td><br /></td><td><br /></td></tr>
				<tr><td><br /></td><td><br /></td></tr>
			</tbody>,
		],
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
		const { content } = attributes;
		return (
			<TableBlock
				onChange={ ( nextContent ) => {
					setAttributes( { content: nextContent } );
				} }
				content={ content }
				focus={ focus }
				onFocus={ setFocus }
			/>
		);
	},

	save( { attributes } ) {
		const { content } = attributes;
		return (
			<table className="blocks-table" style={ { width: '100%' } }>
				{ content }
			</table>
		);
	},
} );
