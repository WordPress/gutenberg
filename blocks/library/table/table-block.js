import Editable from '../../editable';
import BlockControls from '../../block-controls';
import { Toolbar, DropdownMenu } from 'components';

function execCommand( command ) {
	return ( editor ) => {
		if ( editor ) {
			editor.execCommand( command );
		}
	};
}

const TABLE_CONTROLS = [
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
];

export default class TableBlock extends wp.element.Component {
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
			const cell = editor.getBody().querySelector( 'td,th' );
			if ( cell && focus ) {
				cell.focus();
				editor.selection.select( cell, true );
				editor.selection.collapse( false );
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
