/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, Component } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	RichText,
	PanelColorSettings,
	createCustomColorsHOC,
} from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	SelectControl,
	Button,
	Toolbar,
	DropdownMenu,
	ResizableBox,
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
	getStyleValue,
	getStyleUnit,
} from './state';

const BACKGROUND_COLORS = [
	{
		color: '#f3f4f5',
		name: 'Subtle light gray',
		slug: 'subtle-light-gray',
	},
	{
		color: '#e9fbe5',
		name: 'Subtle pale green',
		slug: 'subtle-pale-green',
	},
	{
		color: '#e7f5fe',
		name: 'Subtle pale blue',
		slug: 'subtle-pale-blue',
	},
	{
		color: '#fcf0ef',
		name: 'Subtle pale pink',
		slug: 'subtle-pale-pink',
	},
];

const withCustomBackgroundColors = createCustomColorsHOC( BACKGROUND_COLORS );

export class TableEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onCreateTable = this.onCreateTable.bind( this );
		this.onChangeFixedLayout = this.onChangeFixedLayout.bind( this );
		this.setWidth = this.setWidth.bind( this );
		this.onChangeWidth = this.onChangeWidth.bind( this );
		this.onChangeWidthUnit = this.onChangeWidthUnit.bind( this );
		this.onChangeHeight = this.onChangeHeight.bind( this );
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
			widthUnit: getStyleUnit( this.props.attributes.width ) || '%',
		};
	}

	/**
	 * Updates the initial column count used for table creation.
	 *
	 * @param {number} initialColumnCount New initial column count.
	 */
	onChangeInitialColumnCount( initialColumnCount ) {
		this.setState( { initialColumnCount } );
	}

	/**
	 * Updates the initial row count used for table creation.
	 *
	 * @param {number} initialRowCount New initial row count.
	 */
	onChangeInitialRowCount( initialRowCount ) {
		this.setState( { initialRowCount } );
	}

	/**
	 * Creates a table based on dimensions in local state.
	 *
	 * @param {Object} event Form submit event.
	 */
	onCreateTable( event ) {
		event.preventDefault();

		const { setAttributes } = this.props;
		let { initialRowCount, initialColumnCount } = this.state;

		initialRowCount = parseInt( initialRowCount, 10 ) || 2;
		initialColumnCount = parseInt( initialColumnCount, 10 ) || 2;

		setAttributes( createTable( {
			rowCount: initialRowCount,
			columnCount: initialColumnCount,
		} ) );
	}

	/**
	 * Toggles whether the table has a fixed layout or not.
	 */
	onChangeFixedLayout() {
		const { attributes, setAttributes } = this.props;
		const { hasFixedLayout } = attributes;

		setAttributes( { hasFixedLayout: ! hasFixedLayout } );
	}

	/**
	 * Set the width attribute of the table.
	 *
	 * @param {string|number} rawWidth The width of the table.
	 * @param {string} widthUnit       The width unit to use (e.g. px, %).
	 */
	setWidth( rawWidth, widthUnit ) {
		const width = getStyleValue( rawWidth );
		if ( ! width ) {
			this.props.setAttributes( { width: undefined } );
		} else {
			this.props.setAttributes( { width: `${ width }${ widthUnit }` } );
		}
	}

	/**
	 * Handle a change of the width of the table.
	 *
	 * @param {string} width     The new width of the table.
	 * @param {string} widthUnit The width unit to use (e.g. px, %).
	 */
	onChangeWidth( width ) {
		this.setWidth( width, this.state.widthUnit );
	}

	/**
	 * Handle a change of the width unit.
	 *
	 * @param {string} widthUnit The new width unit (e.g. px, %).
	 */
	onChangeWidthUnit( widthUnit ) {
		this.setState( { widthUnit } );
		this.setWidth( this.props.attributes.width, widthUnit );
	}

	/**
	 * Update the height of the table.
	 *
	 * @param {string} rawHeight The new height of the table.
	 */
	onChangeHeight( rawHeight ) {
		const height = getStyleValue( rawHeight );
		if ( height === undefined ) {
			this.props.setAttributes( { height: undefined } );
		} else {
			this.props.setAttributes( { height: `${ height }px` } );
		}
	}

	/**
	 * Changes the content of the currently selected cell.
	 *
	 * @param {Array} content A RichText content value.
	 */
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

	/**
	 * Inserts a row at the currently selected row index, plus `delta`.
	 *
	 * @param {number} delta Offset for selected row index at which to insert.
	 */
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

	/**
	 * Inserts a row before the currently selected row.
	 */
	onInsertRowBefore() {
		this.onInsertRow( 0 );
	}

	/**
	 * Inserts a row after the currently selected row.
	 */
	onInsertRowAfter() {
		this.onInsertRow( 1 );
	}

	/**
	 * Deletes the currently selected row.
	 */
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

	/**
	 * Inserts a column at the currently selected column index, plus `delta`.
	 *
	 * @param {number} delta Offset for selected column index at which to insert.
	 */
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

	/**
	 * Inserts a column before the currently selected column.
	 */
	onInsertColumnBefore() {
		this.onInsertColumn( 0 );
	}

	/**
	 * Inserts a column after the currently selected column.
	 */
	onInsertColumnAfter() {
		this.onInsertColumn( 1 );
	}

	/**
	 * Deletes the currently selected column.
	 */
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

	/**
	 * Creates an onFocus handler for a specified cell.
	 *
	 * @param {Object} selectedCell Object with `section`, `rowIndex`, and
	 *                              `columnIndex` properties.
	 *
	 * @return {Function} Function to call on focus.
	 */
	createOnFocus( selectedCell ) {
		return () => {
			this.setState( { selectedCell } );
		};
	}

	/**
	 * Gets the table controls to display in the block toolbar.
	 *
	 * @return {Array} Table controls.
	 */
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

	/**
	 * Renders a table section.
	 *
	 * @param {string} options.type Section type: head, body, or foot.
	 * @param {Array}  options.rows The rows to render.
	 *
	 * @return {Object} React element for the section.
	 */
	renderSection( { type, rows } ) {
		if ( ! rows.length ) {
			return null;
		}

		const Tag = `t${ type }`;
		const { selectedCell } = this.state;

		return (
			<Tag>
				{ rows.map( ( { cells }, rowIndex ) => (
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

							const cellClasses = classnames( { 'is-selected': isSelected } );

							return (
								<CellTag
									key={ columnIndex }
									className={ cellClasses }
									onClick={ ( event ) => {
										// When a cell is selected, forward focus to the child contenteditable. This solves an issue where the
										// user may click inside a cell, but outside of the contenteditable, resulting in nothing happening.
										const contentEditable = event && event.target && event.target.querySelector( '[contenteditable=true]' );
										if ( contentEditable ) {
											contentEditable.focus();
										}
									} }
								>
									<RichText
										value={ content }
										onChange={ this.onChange }
										unstableOnFocus={ this.createOnFocus( cell ) }
									/>
								</CellTag>
							);
						} ) }
					</tr>
				) ) }
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
		const {
			attributes,
			className,
			backgroundColor,
			setBackgroundColor,
			toggleSelection,
			setAttributes,
		} = this.props;
		const { initialRowCount, initialColumnCount, widthUnit } = this.state;
		const { hasFixedLayout, head, body, foot, width, height } = attributes;

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

		const classes = classnames( className, backgroundColor.class, {
			'has-fixed-layout': hasFixedLayout,
			'has-background': !! backgroundColor.color,
		} );

		// translators: %s: a unit of measurement for CSS (e.g. 'px' or '%')
		const widthLabel = widthUnit ? sprintf( __( 'Width (%s)' ), widthUnit ) : __( 'Width' );

		return (
			<Fragment>
				<BlockControls>
					<Toolbar>
						<DropdownMenu
							icon="editor-table"
							label={ __( 'Edit table' ) }
							controls={ this.getTableControls() }
						/>
					</Toolbar>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Table Settings' ) } className="blocks-table-settings">
						<div className="block-library-table__dimensions__row">
							<TextControl
								type="number"
								className="block-library-table__dimensions__width"
								label={ widthLabel }
								value={ getStyleValue( width ) }
								min={ 1 }
								onChange={ this.onChangeWidth }
							/>
							<SelectControl
								label={ __( 'Width Unit' ) }
								options={ [
									{
										value: '%',
										label: '%',
									},
									{
										value: 'px',
										label: 'px',
									},
								] }
								value={ widthUnit }
								onChange={ this.onChangeWidthUnit }
							/>
						</div>
						<TextControl
							type="number"
							className="block-library-table__dimensions__height"
							label={ __( 'Height (px)' ) }
							value={ getStyleValue( height ) }
							min={ 1 }
							onChange={ this.onChangeHeight }
						/>
						<ToggleControl
							label={ __( 'Fixed width table cells' ) }
							checked={ !! hasFixedLayout }
							onChange={ this.onChangeFixedLayout }
						/>
					</PanelBody>
					<PanelColorSettings
						title={ __( 'Color Settings' ) }
						initialOpen={ false }
						colorSettings={ [
							{
								value: backgroundColor.color,
								onChange: setBackgroundColor,
								label: __( 'Background Color' ),
								disableCustomColors: true,
								colors: BACKGROUND_COLORS,
							},
						] }
					/>
				</InspectorControls>
				<ResizableBox
					className="block-library-table__resizable-box"
					size={ {
						width,
						height,
					} }
					enable={ {
						right: true,
						bottom: true,
					} }
					onResizeStart={ () => {
						toggleSelection( false );
					} }
					onResizeStop={ ( event, direction, element ) => {
						setAttributes( {
							width: direction === 'right' ? element.style.width : width,
							height: direction === 'bottom' ? element.style.height : height,
						} );
						toggleSelection( true );
					} }
				>
					<table className={ classes }>
						<Section type="head" rows={ head } />
						<Section type="body" rows={ body } />
						<Section type="foot" rows={ foot } />
					</table>
				</ResizableBox>
			</Fragment>
		);
	}
}

export default withCustomBackgroundColors( 'backgroundColor' )( TableEdit );
