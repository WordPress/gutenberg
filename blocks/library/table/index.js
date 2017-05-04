/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { children, prop } = hpq;

let editable = null;

function execCommand( commandId ) {
	const editorNode = editable !== null ? editable.editorNode : null;
	const editor = tinymce.editors.find( ( e ) => e.targetElm === editorNode );
	editor.execCommand( commandId, false, editor );
}

registerBlock( 'core/table', {
	title: wp.i18n.__( 'Table' ),
	icon: 'editor-table',
	category: 'common',

	attributes: {
		nodeName: prop( 'table', 'nodeName' ),
		rows: children( 'tr' )
	},

	controls: [
		{
			icon: 'editor-table',
			title: wp.i18n.__( 'Insert Row Before' ),
			isActive: () => false, //TODO
			onClick() {
				execCommand( 'mceTableInsertRowBefore', false );
			}
		},
		{
			icon: 'editor-table',
			title: wp.i18n.__( 'Insert Row After' ),
			isActive: () => false, //TODO
			onClick() {
				execCommand( 'mceTableInsertRowAfter', false );
			}
		},
	],

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { nodeName = 'TABLE', rows = [ <tr key="1"><td><br /></td><td><br /></td></tr>, <tr key="2"><td><br /></td><td><br /></td></tr> ] } = attributes;
		return (
			<Editable
				ref={ ( e ) => editable = e }
				tagName={ nodeName.toLowerCase() }
				style={ { width: '100%' } }
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
	}
} );
