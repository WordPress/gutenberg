/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, Component } from '@wordpress/element';
import { InspectorControls, BlockControls, RichText } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	Button,
	Toolbar,
	DropdownMenu,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	createTable,
	updateCellContent,
	insertRow,
	deleteRow,
	insertColumn,
	deleteColumn,
} from './state';

/**
 * Browser dependencies
 */
const { parseInt } = window;

export default class TableEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onCreateTable = this.onCreateTable.bind( this );
		this.onChangeFixedLayout = this.onChangeFixedLayout.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onChangeInitialColumnCount = this.onChangeInitialColumnCount.bind( this );
		this.onChangeInitialRowCount = this.onChangeInitialRowCount.bind( this );
		this.renderSection = this.renderSection.bind( this );
		this.getTableControls = this.getTableControls.bind( this );
		this.onInsertRow = this.onInsertRow.bind( this );
		this.onInsertRowBefore = this.onInsertRowBefore.bind( this );
		this.onInsertRowAfter = this.onInsertRowAfter.bind( this );
		this.onDeleteRow = this.onDeleteRow.bind( this );
		this.onInsertColumn = this.onInsertColumn.bind( this );
		this.onInsertColumnBefore = this.onInsertColumnBefore.bind( this );
		this.onInsertColumnAfter = this.onInsertColumnAfter.bind( this );
		this.onDeleteColumn = this.onDeleteColumn.bind( this );

		this.state = {
			initialRowCount: 2,
			initialColumnCount: 2,
			selectedCell: null,
		};
	}

	onChangeInitialColumnCount( initialColumnCount ) {
		this.setState( { initialColumnCount } );
	}

	onChangeInitialRowCount( initialRowCount ) {
		this.setState( { initialRowCount } );
	}

	onCreateTable() {
		const { setAttributes } = this.props;
		let { initialRowCount, initialColumnCount } = this.state;

		initialRowCount = parseInt( initialRowCount, 10 ) || 2;
		initialColumnCount = parseInt( initialColumnCount, 10 ) || 2;

		setAttributes( createTable( {
			rowCount: initialRowCount,
			columnCount: initialColumnCount,
		} ) );
	}

	onChangeFixedLayout() {
		const { attributes, setAttributes } = this.props;
		const { hasFixedLayout } = attributes;

		setAttributes( { hasFixedLayout: ! hasFixedLayout } );
	}

	onChange( content ) {
		const { selectedCell } = this.state;

		if ( ! selectedCell ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { section, rowIndex, columnIndex } = selectedCell;

		setAttributes( updateCellContent( attributes, {
			section,
			rowIndex,
			columnIndex,
			content,
		} ) );
	}

	onInsertRow( delta ) {
		const { selectedCell } = this.state;

		if ( ! selectedCell ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { section, rowIndex } = selectedCell;

		this.setState( { selectedCell: null } );
		setAttributes( insertRow( attributes, {
			section,
			rowIndex: rowIndex + delta,
		} ) );
	}

	onInsertRowBefore() {
		this.onInsertRow( 0 );
	}

	onInsertRowAfter() {
		this.onInsertRow( 1 );
	}

	onDeleteRow() {
		const { selectedCell } = this.state;

		if ( ! selectedCell ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { section, rowIndex } = selectedCell;

		this.setState( { selectedCell: null } );
		setAttributes( deleteRow( attributes, { section, rowIndex } ) );
	}

	onInsertColumn( delta = 0 ) {
		const { selectedCell } = this.state;

		if ( ! selectedCell ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { section, columnIndex } = selectedCell;

		this.setState( { selectedCell: null } );
		setAttributes( insertColumn( attributes, {
			section,
			columnIndex: columnIndex + delta,
		} ) );
	}

	onInsertColumnBefore() {
		this.onInsertColumn( 0 );
	}

	onInsertColumnAfter() {
		this.onInsertColumn( 1 );
	}

	onDeleteColumn() {
		const { selectedCell } = this.state;

		if ( ! selectedCell ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { section, columnIndex } = selectedCell;

		this.setState( { selectedCell: null } );
		setAttributes( deleteColumn( attributes, { section, columnIndex } ) );
	}

	createOnFocus( selectedCell ) {
		return () => {
			this.setState( { selectedCell } );
		};
	}

	getTableControls() {
		const { selectedCell } = this.state;

		return [
			{
				icon: 'table-row-before',
				title: __( 'Add Row Before' ),
				isDisabled: ! selectedCell,
				onClick: this.onInsertRowBefore,
			},
			{
				icon: 'table-row-after',
				title: __( 'Add Row After' ),
				isDisabled: ! selectedCell,
				onClick: this.onInsertRowAfter,
			},
			{
				icon: 'table-row-delete',
				title: __( 'Delete Row' ),
				isDisabled: ! selectedCell,
				onClick: this.onDeleteRow,
			},
			{
				icon: 'table-col-before',
				title: __( 'Add Column Before' ),
				isDisabled: ! selectedCell,
				onClick: this.onInsertColumnBefore,
			},
			{
				icon: 'table-col-after',
				title: __( 'Add Column After' ),
				isDisabled: ! selectedCell,
				onClick: this.onInsertColumnAfter,
			},
			{
				icon: 'table-col-delete',
				title: __( 'Delete Column' ),
				isDisabled: ! selectedCell,
				onClick: this.onDeleteColumn,
			},
		];
	}

	renderSection( { type, rows } ) {
		if ( ! rows.length ) {
			return null;
		}

		const Tag = `t${ type }`;
		const { selectedCell } = this.state;

		return (
			<Tag>
				{ rows.map( ( { cells }, rowIndex ) =>
					<tr key={ rowIndex }>
						{ cells.map( ( { content, tag: CellTag }, columnIndex ) => {
							const isSelected = selectedCell && (
								type === selectedCell.section &&
								rowIndex === selectedCell.rowIndex &&
								columnIndex === selectedCell.columnIndex
							);

							const cell = {
								section: type,
								rowIndex,
								columnIndex,
							};

							const classes = classnames( {
								'is-selected': isSelected,
							} );

							return (
								<CellTag key={ columnIndex } className={ classes }>
									<RichText
										value={ content }
										onChange={ this.onChange }
										unstableOnFocus={ this.createOnFocus( cell ) }
									/>
								</CellTag>
							);
						} ) }
					</tr>
				) }
			</Tag>
		);
	}

	componentDidUpdate() {
		const { isSelected } = this.props;
		const { selectedCell } = this.state;

		if ( ! isSelected && selectedCell ) {
			this.setState( { selectedCell: null } );
		}
	}

	render() {
		const { attributes, className } = this.props;
		const { initialRowCount, initialColumnCount } = this.state;
		const { hasFixedLayout, head, body, foot } = attributes;
		const isEmpty = ! head.length && ! body.length && ! foot.length;
		const Section = this.renderSection;

		if ( isEmpty ) {
			return (
				<form onSubmit={ this.onCreateTable }>
					<TextControl
						type="number"
						label={ __( 'Column Count' ) }
						value={ initialColumnCount }
						onChange={ this.onChangeInitialColumnCount }
						min="1"
					/>
					<TextControl
						type="number"
						label={ __( 'Row Count' ) }
						value={ initialRowCount }
						onChange={ this.onChangeInitialRowCount }
						min="1"
					/>
					<Button isPrimary type="submit">{ __( 'Create' ) }</Button>
				</form>
			);
		}

		const classes = classnames( className, {
			'has-fixed-layout': hasFixedLayout,
		} );

		return (
			<Fragment>
				<BlockControls>
					<Toolbar>
						<DropdownMenu
							icon="editor-table"
							label={ __( 'Edit Table' ) }
							controls={ this.getTableControls() }
						/>
					</Toolbar>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Table Settings' ) } className="blocks-table-settings">
						<ToggleControl
							label={ __( 'Fixed width table cells' ) }
							checked={ !! hasFixedLayout }
							onChange={ this.onChangeFixedLayout }
						/>
					</PanelBody>
				</InspectorControls>
				<table className={ classes }>
					<Section type="head" rows={ head } />
					<Section type="body" rows={ body } />
					<Section type="foot" rows={ foot } />
				</table>
			</Fragment>
		);
	}
}
