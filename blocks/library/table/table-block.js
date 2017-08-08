/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Toolbar, DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Editable from '../../editable';
import BlockControls from '../../block-controls';

function isTableSelected( editor ) {
	return editor.dom.getParent(
		editor.selection.getStart( true ),
		'table',
		editor.getBody().parentNode
	);
}

function selectFirstCell( editor ) {
	const cell = editor.getBody().querySelector( 'td,th' );
	if ( cell ) {
		cell.focus();
		editor.selection.select( cell, true );
		editor.selection.collapse( false );
	}
}

function execCommand( command ) {
	return ( editor ) => {
		if ( editor ) {
			if ( ! isTableSelected( editor ) ) {
				selectFirstCell( editor );
			}
			editor.execCommand( command );
		}
	};
}

const TABLE_CONTROLS = [
	{
		icon: 'table-row-before',
		title: __( 'Insert Row Before' ),
		onClick: execCommand( 'mceTableInsertRowBefore' ),
	},
	{
		icon: 'table-row-after',
		title: __( 'Insert Row After' ),
		onClick: execCommand( 'mceTableInsertRowAfter' ),
	},
	{
		icon: 'table-row-delete',
		title: __( 'Delete Row' ),
		onClick: execCommand( 'mceTableDeleteRow' ),
	},
	{
		icon: 'table-col-before',
		title: __( 'Insert Column Before' ),
		onClick: execCommand( 'mceTableInsertColBefore' ),
	},
	{
		icon: 'table-col-after',
		title: __( 'Insert Column After' ),
		onClick: execCommand( 'mceTableInsertColAfter' ),
	},
	{
		icon: 'table-col-delete',
		title: __( 'Delete Column' ),
		onClick: execCommand( 'mceTableDeleteCol' ),
	},
];

export default class TableBlock extends Component {
	constructor() {
		super();
		this.handleSetup = this.handleSetup.bind( this );
		this.state = {
			editor: null,
		};
	}

	handleSetup( editor, focus ) {
		// select the end of the first table cell
		editor.on( 'init', () => {
			if ( focus ) {
				selectFirstCell( editor );
			}
		} );
		this.setState( { editor } );
	}

	render() {
		const { content, focus, onFocus, onChange, className } = this.props;

		return [
			<Editable
				key="editor"
				tagName="table"
				className={ className }
				getSettings={ ( settings ) => ( {
					...settings,
					plugins: ( settings.plugins || [] ).concat( 'table' ),
					table_tab_navigation: false,
				} ) }
				onSetup={ ( editor ) => this.handleSetup( editor, focus ) }
				onChange={ onChange }
				value={ content }
				focus={ focus }
				onFocus={ onFocus }
			/>,
			focus && (
				<BlockControls key="menu">
					<Toolbar>
						<li>
							<DropdownMenu
								icon="editor-table"
								label={ __( 'Edit Table' ) }
								controls={
									TABLE_CONTROLS.map( ( control ) => ( {
										...control,
										onClick: () => control.onClick( this.state.editor ),
									} ) ) }
							/>
						</li>
					</Toolbar>
				</BlockControls>
			),
		];
	}
}
