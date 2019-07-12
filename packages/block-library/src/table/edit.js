/**
 * External dependencies
 */
import classnames from 'classnames';
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	RichText,
	PanelColorSettings,
	createCustomColorsHOC,
	BlockIcon,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	IconButton,
	Button,
	Toolbar,
	DropdownMenu,
	Placeholder,
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
	toggleSection,
	isEmptyTableSection,
	isCellInMultiSelection,
	getCellAbove,
	getCellBelow,
	getCellToRight,
	getCellToLeft,
} from './state';
import icon from './icon';

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
		this.onToggleHeaderSection = this.onToggleHeaderSection.bind( this );
		this.onToggleFooterSection = this.onToggleFooterSection.bind( this );
		this.getMultiSelectionClasses = this.getMultiSelectionClasses.bind( this );

		this.state = {
			initialRowCount: 2,
			initialColumnCount: 2,
			selection: null,
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
	 * Changes the content of the currently selected cell.
	 *
	 * @param {Array} content A RichText content value.
	 */
	onChange( content ) {
		const { selection } = this.state;

		if ( ! selection ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { section, rowIndex, columnIndex } = selection;

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
		const { selection } = this.state;

		if ( ! selection ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { section, rowIndex } = selection;

		this.setState( { selection: null } );
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

	onToggleHeaderSection() {
		const { attributes, setAttributes } = this.props;
		setAttributes( toggleSection( attributes, 'head' ) );
	}

	onToggleFooterSection() {
		const { attributes, setAttributes } = this.props;
		setAttributes( toggleSection( attributes, 'foot' ) );
	}

	/**
	 * Deletes the currently selected row.
	 */
	onDeleteRow() {
		const { selection } = this.state;

		if ( ! selection ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { section, rowIndex } = selection;

		this.setState( { selection: null } );
		setAttributes( deleteRow( attributes, { section, rowIndex } ) );
	}

	/**
	 * Inserts a column at the currently selected column index, plus `delta`.
	 *
	 * @param {number} delta Offset for selected column index at which to insert.
	 */
	onInsertColumn( delta = 0 ) {
		const { selection } = this.state;

		if ( ! selection ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { columnIndex } = selection;

		this.setState( { selection: null } );
		setAttributes( insertColumn( attributes, {
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
		const { selection } = this.state;

		if ( ! selection ) {
			return;
		}

		const { attributes, setAttributes } = this.props;
		const { section, columnIndex } = selection;

		this.setState( { selection: null } );
		setAttributes( deleteColumn( attributes, { section, columnIndex } ) );
	}

	getMultiSelectionClasses( cellLocation, selection ) {
		const { attributes } = this.props;

		return {
			'is-multi-selected': true,
			'is-multi-selection-top-edge': ! isCellInMultiSelection( getCellAbove( attributes, cellLocation ), selection ),
			'is-multi-selection-right-edge': ! isCellInMultiSelection( getCellToRight( attributes, cellLocation ), selection ),
			'is-multi-selection-bottom-edge': ! isCellInMultiSelection( getCellBelow( attributes, cellLocation ), selection ),
			'is-multi-selection-left-edge': ! isCellInMultiSelection( getCellToLeft( cellLocation ), selection ),
		};
	}

	/**
	 * Creates an onFocus handler for a specified cell.
	 *
	 * @param {Object} selection Object with `section`, `rowIndex`, and
	 *                           `columnIndex` properties.
	 *
	 * @return {Function} Function to call on focus.
	 */
	createOnFocus( selection ) {
		return () => {
			this.setState( { selection } );
		};
	}

	/**
	 * Gets the table controls to display in the block toolbar.
	 *
	 * @return {Array} Table controls.
	 */
	getTableControls() {
		const { selection } = this.state;

		const canPerformRowOperations = selection && includes( selection.type, [ 'cell', 'row' ] );
		const canPerformColumnOperations = selection && includes( selection.type, [ 'cell', 'column' ] );

		return [
			{
				icon: 'table-row-before',
				title: __( 'Add Row Before' ),
				isDisabled: ! canPerformRowOperations,
				onClick: this.onInsertRowBefore,
			},
			{
				icon: 'table-row-after',
				title: __( 'Add Row After' ),
				isDisabled: ! canPerformRowOperations,
				onClick: this.onInsertRowAfter,
			},
			{
				icon: 'table-row-delete',
				title: __( 'Delete Row' ),
				isDisabled: ! canPerformRowOperations,
				onClick: this.onDeleteRow,
			},
			{
				icon: 'table-col-before',
				title: __( 'Add Column Before' ),
				isDisabled: ! canPerformColumnOperations,
				onClick: this.onInsertColumnBefore,
			},
			{
				icon: 'table-col-after',
				title: __( 'Add Column After' ),
				isDisabled: ! canPerformColumnOperations,
				onClick: this.onInsertColumnAfter,
			},
			{
				icon: 'table-col-delete',
				title: __( 'Delete Column' ),
				isDisabled: ! canPerformColumnOperations,
				onClick: this.onDeleteColumn,
			},
		];
	}

	/**
	 * Renders a table section.
	 *
	 * @param {string} options.section Section type: head, body, or foot.
	 * @param {Array}  options.rows        The rows to render.
	 *
	 * @return {Object} React element for the section.
	 */
	renderSection( { type: section, rows, showBlockSelectionControls } ) {
		if ( isEmptyTableSection( rows ) ) {
			return null;
		}

		const Tag = `t${ section }`;
		const { selection } = this.state;

		return (
			<Tag>
				{ rows.map( ( { cells }, rowIndex ) => (
					<tr key={ rowIndex }>
						{ cells.map( ( { content, tag: CellTag, scope }, columnIndex ) => {
							const isSelectedCell = selection && (
								'cell' === selection.type &&
								section === selection.section &&
								rowIndex === selection.rowIndex &&
								columnIndex === selection.columnIndex
							);

							const cellLocation = { section, rowIndex, columnIndex };
							const isInMultiCellSelection = isCellInMultiSelection( cellLocation, selection );
							const multiSelectionClasses = isInMultiCellSelection ? this.getMultiSelectionClasses( cellLocation, selection ) : undefined;
							const cellClasses = classnames( {
								'is-selected-cell': isSelectedCell,
							}, multiSelectionClasses );

							return (
								<CellTag
									key={ columnIndex }
									className={ cellClasses }
									scope={ CellTag === 'th' ? scope : undefined }
								>
									{ showBlockSelectionControls && rowIndex === 0 && columnIndex === 0 && (
										<IconButton
											className="wp-block-table__table-selection-button"
											label={ __( 'Select all' ) }
											icon="grid-view"
											onClick={ () => this.setState( { selection: { type: 'table' } } ) }
										/>
									) }
									{ columnIndex === 0 && (
										<IconButton
											className="wp-block-table__row-selection-button"
											label={ __( 'Select row' ) }
											icon="arrow-right"
											onClick={ () => this.setState( {
												selection: {
													type: 'row',
													section,
													rowIndex,
												},
											} ) }
										/>
									) }
									{ showBlockSelectionControls && rowIndex === 0 && (
										<IconButton
											className="wp-block-table__column-selection-button"
											label={ __( 'Select column' ) }
											icon="arrow-down"
											onClick={ () => this.setState( {
												selection: {
													type: 'column',
													columnIndex,
												},
											} ) }
										/>
									) }
									<RichText
										className="wp-block-table__cell-content"
										value={ content }
										onChange={ this.onChange }
										unstableOnFocus={ this.createOnFocus( {
											type: 'cell',
											...cellLocation,
										} ) }
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
		const { selection } = this.state;

		if ( ! isSelected && selection ) {
			this.setState( { selection: null } );
		}
	}

	render() {
		const {
			attributes,
			className,
			backgroundColor,
			setBackgroundColor,
		} = this.props;
		const { initialRowCount, initialColumnCount } = this.state;
		const { hasFixedLayout, head, body, foot } = attributes;
		const isEmptyHead = isEmptyTableSection( head );
		const isEmptyBody = isEmptyTableSection( body );
		const isEmptyFoot = isEmptyTableSection( foot );
		const isEmpty = isEmptyHead && isEmptyBody && isEmptyFoot;
		const Section = this.renderSection;

		if ( isEmpty ) {
			return (
				<Placeholder
					label={ __( 'Table' ) }
					icon={ <BlockIcon icon={ icon } showColors /> }
					instructions={ __( 'Insert a table for sharing data.' ) }
					isColumnLayout
				>
					<form className="wp-block-table__placeholder-form" onSubmit={ this.onCreateTable }>
						<TextControl
							type="number"
							label={ __( 'Column Count' ) }
							value={ initialColumnCount }
							onChange={ this.onChangeInitialColumnCount }
							min="1"
							className="wp-block-table__placeholder-input"
						/>
						<TextControl
							type="number"
							label={ __( 'Row Count' ) }
							value={ initialRowCount }
							onChange={ this.onChangeInitialRowCount }
							min="1"
							className="wp-block-table__placeholder-input"
						/>
						<Button className="wp-block-table__placeholder-button" isDefault type="submit">{ __( 'Create Table' ) }</Button>
					</form>
				</Placeholder>
			);
		}

		const tableClasses = classnames( backgroundColor.class, {
			'has-fixed-layout': hasFixedLayout,
			'has-background': !! backgroundColor.color,
		} );

		return (
			<>
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
						<ToggleControl
							label={ __( 'Fixed width table cells' ) }
							checked={ !! hasFixedLayout }
							onChange={ this.onChangeFixedLayout }
						/>
						<ToggleControl
							label={ __( 'Header section' ) }
							checked={ !! ( head && head.length ) }
							onChange={ this.onToggleHeaderSection }
						/>
						<ToggleControl
							label={ __( 'Footer section' ) }
							checked={ !! ( foot && foot.length ) }
							onChange={ this.onToggleFooterSection }
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
				<figure className={ className }>
					<table className={ tableClasses }>
						<Section type="head" rows={ head } showBlockSelectionControls={ true } />
						<Section type="body" rows={ body } showBlockSelectionControls={ isEmptyHead } />
						<Section type="foot" rows={ foot } />
					</table>
				</figure>
			</>
		);
	}
}

export default withCustomBackgroundColors( 'backgroundColor' )( TableEdit );
