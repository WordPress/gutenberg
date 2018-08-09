/**
 * External dependencies
 */
import classnames from 'classnames';
import { times } from 'lodash';

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
} from '@wordpress/components';

export default class extends Component {
	constructor() {
		super( ...arguments );

		this.onCreateTable = this.onCreateTable.bind( this );
		this.onChangeFixedLayout = this.onChangeFixedLayout.bind( this );
		this.createOnChange = this.createOnChange.bind( this );
		this.onChangeInitialColumnCount = this.onChangeInitialColumnCount.bind( this );
		this.onChangeInitialRowCount = this.onChangeInitialRowCount.bind( this );
		this.renderPart = this.renderPart.bind( this );
		this.getTableControls = this.getTableControls.bind( this );
		this.createOnDeleteRow = this.createOnDeleteRow.bind( this );
		this.createOnDeleteColumn = this.createOnDeleteColumn.bind( this );
		this.createOnInsertRow = this.createOnInsertRow.bind( this );
		this.createOnInsertColumn = this.createOnInsertColumn.bind( this );
		this.createOnFocus = this.createOnFocus.bind( this );

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
		const { initialRowCount, initialColumnCount } = this.state;

		setAttributes( {
			body: times( initialRowCount, () => ( {
				cells: times( initialColumnCount, () => ( {
					content: [],
					tag: 'td',
				} ) ),
			} ) ),
		} );
	}

	onChangeFixedLayout() {
		const { attributes, setAttributes } = this.props;
		const { hasFixedLayout } = attributes;

		setAttributes( { hasFixedLayout: ! hasFixedLayout } );
	}

	createOnChange( { part, rowIndex, cellIndex } ) {
		const { attributes, setAttributes } = this.props;

		return ( content ) => {
			setAttributes( {
				[ part ]: attributes[ part ].map( ( row, i ) => {
					if ( i !== rowIndex ) {
						return row;
					}

					return {
						cells: row.cells.map( ( cell, ii ) => {
							if ( ii !== cellIndex ) {
								return cell;
							}

							return {
								...cell,
								content,
							};
						} ),
					};
				} ),
			} );
		};
	}

	createOnInsertRow( { part, rowIndex }, delta ) {
		const { attributes, setAttributes } = this.props;
		const cellCount = attributes[ part ][ rowIndex ].cells.length;

		rowIndex += delta;

		return () => {
			setAttributes( {
				[ part ]: [
					...attributes[ part ].slice( 0, rowIndex ),
					{
						cells: times( cellCount, () => ( {
							content: [],
							tag: 'td',
						} ) ),
					},
					...attributes[ part ].slice( rowIndex ),
				],
			} );

			this.setState( { selectedCell: null } );
		};
	}

	createOnDeleteRow( { part, rowIndex } ) {
		const { attributes, setAttributes } = this.props;

		return () => {
			setAttributes( {
				[ part ]: attributes[ part ].filter( ( row, index ) => index !== rowIndex ),
			} );

			this.setState( { selectedCell: null } );
		};
	}

	createOnInsertColumn( { part, cellIndex }, delta ) {
		const { attributes, setAttributes } = this.props;

		cellIndex += delta;

		return () => {
			setAttributes( {
				[ part ]: attributes[ part ].map( ( row ) => ( {
					cells: [
						...row.cells.slice( 0, cellIndex ),
						{
							content: [],
							tag: 'td',
						},
						...row.cells.slice( cellIndex ),
					],
				} ) ),
			} );

			this.setState( { selectedCell: null } );
		};
	}

	createOnDeleteColumn( { part, cellIndex } ) {
		const { attributes, setAttributes } = this.props;

		return () => {
			setAttributes( {
				[ part ]: attributes[ part ].map( ( row ) => ( {
					cells: row.cells.filter( ( cell, index ) => index !== cellIndex ),
				} ) ),
			} );

			this.setState( { selectedCell: null } );
		};
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
				onClick: selectedCell && this.createOnInsertRow( selectedCell ),
			},
			{
				icon: 'table-row-after',
				title: __( 'Add Row After' ),
				isDisabled: ! selectedCell,
				onClick: selectedCell && this.createOnInsertRow( selectedCell, 1 ),
			},
			{
				icon: 'table-row-delete',
				title: __( 'Delete Row' ),
				isDisabled: ! selectedCell,
				onClick: selectedCell && this.createOnDeleteRow( selectedCell ),
			},
			{
				icon: 'table-col-before',
				title: __( 'Add Column Before' ),
				isDisabled: ! selectedCell,
				onClick: selectedCell && this.createOnInsertColumn( selectedCell ),
			},
			{
				icon: 'table-col-after',
				title: __( 'Add Column After' ),
				isDisabled: ! selectedCell,
				onClick: selectedCell && this.createOnInsertColumn( selectedCell, 1 ),
			},
			{
				icon: 'table-col-delete',
				title: __( 'Delete Column' ),
				isDisabled: ! selectedCell,
				onClick: selectedCell && this.createOnDeleteColumn( selectedCell ),
			},
		];
	}

	renderPart( { type, rows } ) {
		if ( ! rows.length ) {
			return null;
		}

		const Tag = `t${ type }`;
		const { selectedCell } = this.state;

		return (
			<Tag>
				{ rows.map( ( { cells }, rowIndex ) =>
					<tr key={ rowIndex }>
						{ cells.map( ( { content, tag: CellTag }, cellIndex ) => {
							const isSelected = selectedCell && (
								type === selectedCell.part &&
								rowIndex === selectedCell.rowIndex &&
								cellIndex === selectedCell.cellIndex
							);

							const id = {
								part: type,
								rowIndex,
								cellIndex,
							};

							const classes = classnames( {
								'is-selected': isSelected,
							} );

							return (
								<CellTag key={ cellIndex } className={ classes }>
									<RichText
										value={ content }
										onChange={ this.createOnChange( id ) }
										placeholder={ __( 'Add cell content' ) }
										unstableOnFocus={ this.createOnFocus( id ) }
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
		const Part = this.renderPart;

		if ( isEmpty ) {
			return (
				<Fragment>
					<TextControl
						type="number"
						label={ __( 'Column Count' ) }
						value={ initialColumnCount }
						onChange={ this.onChangeInitialColumnCount }
					/>
					<TextControl
						type="number"
						label={ __( 'Row Count' ) }
						value={ initialRowCount }
						onChange={ this.onChangeInitialRowCount }
					/>
					<Button isPrimary onClick={ this.onCreateTable }>Create</Button>
				</Fragment>
			);
		}

		const classes = classnames( className, {
			'has-fixed-layout': hasFixedLayout,
		} );

		return (
			<Fragment>
				<BlockControls>
					<Toolbar controls={ this.getTableControls() } />
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
					<Part type="head" rows={ head } />
					<Part type="body" rows={ body } />
					<Part type="foot" rows={ foot } />
				</table>
			</Fragment>
		);
	}
}
