import Editable from '../../editable';
import BlockControls from '../../block-controls';
import { ToolbarMenu } from 'components';

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
		this.state = {
			editor: null,
		};
	}

	render() {
		const { content, focus, onFocus, onChange } = this.props;

		return [
			<Editable
				key="editor"
				tagName="table"
				getSettings={ ( settings ) => ( {
					...settings,
					plugins: ( settings.plugins || [] ).concat( 'table' ),
				} ) }
				onSetup={ ( editor ) => this.setState( { editor } ) }
				onChange={ onChange }
				value={ content }
				focus={ focus }
				onFocus={ onFocus }
			/>,
			focus && (
				<BlockControls key="menu">
					<ToolbarMenu
						icon="editor-table"
						controls={
							TABLE_CONTROLS.map( ( control ) => ( {
								...control,
								onClick: () => control.onClick( this.state.editor ),
							} ) ) }
					/>
				</BlockControls>
			),
		];
	}
}
