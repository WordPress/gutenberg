/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Toolbar, DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	AlignmentToolbar,
	BlockControls,
	RichText,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { domToFormat } from '../../editor/components/rich-text/format';

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
		title: __( 'Add Row Before' ),
		onClick: execCommand( 'mceTableInsertRowBefore' ),
	},
	{
		icon: 'table-row-after',
		title: __( 'Add Row After' ),
		onClick: execCommand( 'mceTableInsertRowAfter' ),
	},
	{
		icon: 'table-row-delete',
		title: __( 'Delete Row' ),
		onClick: execCommand( 'mceTableDeleteRow' ),
	},
	{
		icon: 'table-col-before',
		title: __( 'Add Column Before' ),
		onClick: execCommand( 'mceTableInsertColBefore' ),
	},
	{
		icon: 'table-col-after',
		title: __( 'Add Column After' ),
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
		this.alignText = this.alignText.bind( this );
		this.state = {
			editor: null,
		};
	}

	handleSetup( editor, isSelected ) {
		// select the end of the first table cell
		editor.on( 'init', () => {
			if ( isSelected ) {
				selectFirstCell( editor );
			}
		} );

		// Update the alignment toolbar to match the CSS `text-align`
		// property of the current table cell.
		editor.on( 'nodechange', ( { selectionChange, parents } ) => {
			if ( document.activeElement !== editor.getBody() ) {
				return;
			}
			if ( selectionChange ) {
				const selectedCell = find( parents, ( node ) => node.tagName === 'TD' || node.tagName === 'TH' );
				const textAlign = selectedCell ? selectedCell.style.textAlign : null;
				this.setState( { textAlign } );
			}
		} );

		this.setState( { editor } );
	}

	/**
	 * Sets the CSS `text-align` property of the current table cell.
	 *
	 * @param {string} nextAlign The next `text-align` value to set.
	 */
	alignText( nextAlign ) {
		const { editor } = this.state;
		const { onChange } = this.props;
		const currentNode = editor.selection.getNode();
		const tableCell = editor.dom.getParent( currentNode, ( parentNode ) => parentNode.tagName === 'TD' || parentNode.tagName === 'TH' );

		if ( tableCell ) {
			// If `nextAlign` is undefined, set the `textAlign` value to an empty
			// string in order to update both the CSS `text-align` property on the
			// current table cell and the current state value.
			const textAlign = nextAlign ? nextAlign : '';
			editor.dom.setStyle( tableCell, 'text-align', textAlign );
			const content = domToFormat( editor.getBody().childNodes || [], 'element', editor );
			onChange( content );
			this.setState( { textAlign } );
		}
	}

	render() {
		const { content, onChange, className, isSelected } = this.props;

		return (
			<Fragment>
				<RichText
					tagName="table"
					wrapperClassName={ className }
					getSettings={ ( settings ) => ( {
						...settings,
						plugins: ( settings.plugins || [] ).concat( 'table' ),
						table_tab_navigation: false,
					} ) }
					onSetup={ ( editor ) => this.handleSetup( editor, isSelected ) }
					onChange={ onChange }
					value={ content }
				/>
				<BlockControls>
					<Toolbar>
						<DropdownMenu
							icon="editor-table"
							label={ __( 'Edit Table' ) }
							controls={
								TABLE_CONTROLS.map( ( control ) => ( {
									...control,
									onClick: () => control.onClick( this.state.editor ),
								} ) ) }
						/>
					</Toolbar>
					<AlignmentToolbar
						value={ this.state.textAlign }
						onChange={ this.alignText }
					/>
				</BlockControls>
			</Fragment>
		);
	}
}
