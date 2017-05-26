/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';
import Editable from '../../editable';

const { children, prop } = hpq;

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

function execCommand( command ) {
	return ( { editor } ) => {
		if ( editor ) {
			editor.execCommand( command );
		}
	};
}

function internalValue( defaultValue ) {
	const thunk = () => defaultValue;
	thunk._wpBlocksKnownMatcher = true;
	return thunk;
}

registerBlock( 'core/table2', {
	title: wp.i18n.__( 'Table2' ),
	icon: 'editor-table',
	category: 'common',

	attributes: {
		nodeName: prop( 'table', 'nodeName' ),
		content: children( 'table' ),
		editor: internalValue( null ),
	},

	defaultAttributes: {
		nodeName: 'TABLE',
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

	advIcon: 'editor-table',

	advControls: [
		{
			icon: 'table-row-before',
			title: wp.i18n.__( 'Insert Row Before' ),
			onClick: execCommand( 'mceTableInsertRowBefore' ),
		},
		{
			icon: 'table-row-after',
			title: wp.i18n.__( 'Insert Row After' ),
			onClick: execCommand( 'mceTableInsertRowAfter' ),
		},
		{
			icon: 'table-row-delete',
			title: wp.i18n.__( 'Delete Row' ),
			onClick: execCommand( 'mceTableDeleteRow' ),
		},
		{
			icon: 'table-col-before',
			title: wp.i18n.__( 'Insert Column Before' ),
			onClick: execCommand( 'mceTableInsertColBefore' ),
		},
		{
			icon: 'table-col-after',
			title: wp.i18n.__( 'Insert Column After' ),
			onClick: execCommand( 'mceTableInsertColAfter' ),
		},
		{
			icon: 'table-col-delete',
			title: wp.i18n.__( 'Delete Column' ),
			onClick: execCommand( 'mceTableDeleteCol' ),
		},
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { nodeName, content } = attributes;
		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				getSettings={ ( settings ) => ( {
					...settings,
					plugins: ( settings.plugins || [] ).concat( 'table' ),
				} ) }
				style={ { width: '100%' } }
				onSetup={ ( editor ) => setAttributes( { editor } ) }
				onChange={ ( nextContent ) => {
					setAttributes( { content: nextContent } );
				} }
				value={ content }
				focus={ focus }
				onFocus={ setFocus }
				showAlignments
				className="blocks-table" />
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
