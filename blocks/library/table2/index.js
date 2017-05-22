/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from '../../api';
import Editable from '../../editable';

const { children, prop } = hpq;

function execCommand( command ) {
	return ( { editor } ) => {
		if ( editor ) {
			editor.execCommand( command );
		}
	};
}

registerBlock( 'core/table2', {
	title: wp.i18n.__( 'Table2' ),
	icon: 'editor-table',
	category: 'common',

	attributes: {
		nodeName: prop( 'table', 'nodeName' ),
		rows: children( 'tr' ),
	},

	controls: [
		{
			icon: 'table-row-before',
			title: wp.i18n.__( 'Insert Row Before' ),
			isActive: () => false,
			onClick: execCommand( 'mceTableInsertRowBefore' ),
		},
		{
			icon: 'table-row-after',
			title: wp.i18n.__( 'Insert Row After' ),
			isActive: () => false,
			onClick: execCommand( 'mceTableInsertRowAfter' ),
		},
		{
			icon: 'table-row-delete',
			title: wp.i18n.__( 'Delete Row' ),
			isActive: () => false,
			onClick: execCommand( 'mceTableDeleteRow' ),
		},
		{
			icon: 'table-col-before',
			title: wp.i18n.__( 'Insert Column Before' ),
			isActive: () => false,
			onClick: execCommand( 'mceTableInsertColBefore' ),
		},
		{
			icon: 'table-col-after',
			title: wp.i18n.__( 'Insert Column After' ),
			isActive: () => false,
			onClick: execCommand( 'mceTableInsertColAfter' ),
		},
		{
			icon: 'table-col-delete',
			title: wp.i18n.__( 'Delete Column' ),
			isActive: () => false,
			onClick: execCommand( 'mceTableDeleteCol' ),
		},
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { nodeName = 'TABLE', rows = [ <tr key="1"><td><br /></td><td><br /></td></tr>, <tr key="2"><td><br /></td><td><br /></td></tr> ] } = attributes;
		return (
			<Editable
				tagName={ nodeName.toLowerCase() }
				getSettings={ ( settings ) => ( {
					...settings,
					plugins: ( settings.plugins || [] ).concat( 'table' ),
				} ) }
				style={ { width: '100%' } }
				onSetup={ ( editor ) => setAttributes( { editor } ) }
				onChange={ ( nextRows ) => {
					setAttributes( { rows: nextRows } );
				} }
				value={ rows }
				focus={ focus }
				onFocus={ setFocus }
				showAlignments
				className="blocks-table" />
		);
	},

	save( { attributes } ) {
		const { rows = [ <tr key="1"><td><br /></td><td><br /></td></tr>, <tr key="2"><td><br /></td><td><br /></td></tr> ] } = attributes;

		return (
			<table className="blocks-table" style={ { width: '100%' } }>
				{ rows }
			</table>
		);
	},
} );
