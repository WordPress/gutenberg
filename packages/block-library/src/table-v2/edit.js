/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	BlockIcon,
	AlignmentControl,
	useBlockProps,
	useInnerBlocksProps,
	useInnerBlockItems,
	store as blockEditorStore,
	__experimentalUseColorProps as useColorProps,
	__experimentalUseBorderProps as useBorderProps,
} from '@wordpress/block-editor';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Placeholder,
	TextControl,
	ToggleControl,
	ToolbarDropdownMenu,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	alignLeft,
	alignRight,
	alignCenter,
	blockTable as icon,
	tableColumnAfter,
	tableColumnBefore,
	tableColumnDelete,
	tableRowAfter,
	tableRowBefore,
	tableRowDelete,
	table,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	createTableCells,
	getGridDimensions,
	getSelectedCellLocation,
	mapCellsToSections,
	insertRow,
	deleteRow,
	insertColumn,
	deleteColumn,
	toggleSection,
	sortCells,
} from './utils';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const ALIGNMENT_CONTROLS = [
	{
		icon: alignLeft,
		title: __( 'Align column left' ),
		align: 'left',
	},
	{
		icon: alignCenter,
		title: __( 'Align column center' ),
		align: 'center',
	},
	{
		icon: alignRight,
		title: __( 'Align column right' ),
		align: 'right',
	},
];

function TSection( { name, ...props } ) {
	const TagName = `t${ name }`;
	return <TagName { ...props } />;
}

export default function TableEdit( { attributes, setAttributes, clientId } ) {
	const { hasFixedLayout } = attributes;
	const [ initialRowCount, setInitialRowCount ] = useState( 2 );
	const [ initialColumnCount, setInitialColumnCount ] = useState( 2 );

	const colorProps = useColorProps( attributes );
	const borderProps = useBorderProps( attributes );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const registry = useRegistry();

	const { replaceInnerBlocks, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const { innerBlocks, selectedCellId } = useSelect(
		( select ) => {
			const {
				getBlocks,
				getSelectedBlockClientId,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );
			const blocks = getBlocks( clientId );
			const selectedId = getSelectedBlockClientId();

			return {
				innerBlocks: blocks,
				selectedCellId: hasSelectedInnerBlock( clientId, true )
					? selectedId
					: null,
			};
		},
		[ clientId ]
	);

	const isEmpty = innerBlocks.length === 0;
	const { columnCount, sectionRowCounts } = isEmpty
		? { columnCount: 0, sectionRowCounts: { head: 0, body: 0, foot: 0 } }
		: getGridDimensions( innerBlocks );

	const hasHeader = sectionRowCounts.head > 0;
	const hasFooter = sectionRowCounts.foot > 0;

	const selectedCellLocation = selectedCellId
		? getSelectedCellLocation( innerBlocks, selectedCellId )
		: null;

	// Structural operations: these replace the entire inner blocks array.
	const replaceTableCells = useCallback(
		( newCells ) => {
			replaceInnerBlocks( clientId, sortCells( newCells ), false );
		},
		[ clientId, replaceInnerBlocks ]
	);

	function onCreateTable( event ) {
		event.preventDefault();
		const cells = createTableCells( {
			rowCount: parseInt( initialRowCount, 10 ) || 2,
			columnCount: parseInt( initialColumnCount, 10 ) || 2,
		} );
		replaceInnerBlocks( clientId, cells, true );
	}

	function onToggleHeaderSection() {
		replaceTableCells( toggleSection( innerBlocks, { section: 'head' } ) );
	}

	function onToggleFooterSection() {
		replaceTableCells( toggleSection( innerBlocks, { section: 'foot' } ) );
	}

	function onChangeFixedLayout() {
		setAttributes( { hasFixedLayout: ! hasFixedLayout } );
	}

	function onInsertRow( delta ) {
		if ( ! selectedCellLocation ) {
			return;
		}
		const { section, row } = selectedCellLocation;
		const newRowIndex = row + delta;
		replaceTableCells(
			insertRow( innerBlocks, {
				section,
				rowIndex: newRowIndex,
				columnCount,
			} )
		);
	}

	function onInsertRowBefore() {
		onInsertRow( 0 );
	}

	function onInsertRowAfter() {
		onInsertRow( 1 );
	}

	function onDeleteRow() {
		if ( ! selectedCellLocation ) {
			return;
		}
		replaceTableCells(
			deleteRow( innerBlocks, {
				section: selectedCellLocation.section,
				rowIndex: selectedCellLocation.row,
			} )
		);
	}

	function onInsertColumn( delta ) {
		if ( ! selectedCellLocation ) {
			return;
		}
		const newColumnIndex = selectedCellLocation.column + delta;
		replaceTableCells(
			insertColumn( innerBlocks, { columnIndex: newColumnIndex } )
		);
	}

	function onInsertColumnBefore() {
		onInsertColumn( 0 );
	}

	function onInsertColumnAfter() {
		onInsertColumn( 1 );
	}

	function onDeleteColumn() {
		if ( ! selectedCellLocation ) {
			return;
		}
		replaceTableCells(
			deleteColumn( innerBlocks, {
				columnIndex: selectedCellLocation.column,
			} )
		);
	}

	function onChangeColumnAlignment( align ) {
		if ( ! selectedCellLocation ) {
			return;
		}
		const { column } = selectedCellLocation;
		registry.batch( () => {
			for ( const cell of innerBlocks ) {
				if ( cell.attributes.column === column ) {
					updateBlockAttributes( cell.clientId, { align } );
				}
			}
		} );
	}

	function getCellAlignment() {
		if ( ! selectedCellLocation ) {
			return undefined;
		}
		const cell = innerBlocks.find(
			( c ) => c.attributes.column === selectedCellLocation.column
		);
		return cell?.attributes?.align;
	}

	const tableControls = [
		{
			icon: tableRowBefore,
			title: __( 'Insert row before' ),
			isDisabled: ! selectedCellLocation,
			onClick: onInsertRowBefore,
		},
		{
			icon: tableRowAfter,
			title: __( 'Insert row after' ),
			isDisabled: ! selectedCellLocation,
			onClick: onInsertRowAfter,
		},
		{
			icon: tableRowDelete,
			title: __( 'Delete row' ),
			isDisabled: ! selectedCellLocation,
			onClick: onDeleteRow,
		},
		{
			icon: tableColumnBefore,
			title: __( 'Insert column before' ),
			isDisabled: ! selectedCellLocation,
			onClick: onInsertColumnBefore,
		},
		{
			icon: tableColumnAfter,
			title: __( 'Insert column after' ),
			isDisabled: ! selectedCellLocation,
			onClick: onInsertColumnAfter,
		},
		{
			icon: tableColumnDelete,
			title: __( 'Delete column' ),
			isDisabled: ! selectedCellLocation,
			onClick: onDeleteColumn,
		},
	];

	const blockProps = useBlockProps();

	// useInnerBlocksProps sets up inner block infrastructure (nested settings,
	// drop zones, template sync, allowed blocks). We destructure `children` out
	// because we render the items ourselves via useInnerBlockItems, and spread
	// the remaining props (ref, className, etc.) onto the <table> element.
	const { children: _innerBlocksChildren, ...innerBlocksProps } =
		useInnerBlocksProps(
			{
				className: clsx( colorProps.className, borderProps.className, {
					'has-fixed-layout': hasFixedLayout,
					'has-individual-borders': hasSplitBorders(
						attributes?.style?.border
					),
				} ),
				style: {
					...colorProps.style,
					...borderProps.style,
				},
			},
			{
				allowedBlocks: [ 'core/table-v2-cell' ],
				renderAppender: false,
				__experimentalCaptureToolbars: true,
			}
		);

	// Get individual block elements that we can place in the table structure.
	const items = useInnerBlockItems();

	// Build a map from clientId to rendered item for placement in the table.
	const itemsByClientId = useMemo( () => {
		const map = {};
		for ( const item of items ) {
			map[ item.key ] = item;
		}
		return map;
	}, [ items ] );

	// Map the flat cell blocks into sections and rows.
	const sections = useMemo(
		() => mapCellsToSections( innerBlocks ),
		[ innerBlocks ]
	);

	return (
		<figure { ...blockProps }>
			{ ! isEmpty && (
				<>
					<BlockControls group="block">
						<AlignmentControl
							label={ __( 'Change column alignment' ) }
							alignmentControls={ ALIGNMENT_CONTROLS }
							value={ getCellAlignment() }
							onChange={ ( nextAlign ) =>
								onChangeColumnAlignment( nextAlign )
							}
						/>
					</BlockControls>
					<BlockControls group="other">
						<ToolbarDropdownMenu
							icon={ table }
							label={ __( 'Edit table' ) }
							controls={ tableControls }
						/>
					</BlockControls>
				</>
			) }
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( { hasFixedLayout: true } );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => hasFixedLayout !== true }
						label={ __( 'Fixed width table cells' ) }
						onDeselect={ () =>
							setAttributes( { hasFixedLayout: true } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Fixed width table cells' ) }
							checked={ !! hasFixedLayout }
							onChange={ onChangeFixedLayout }
						/>
					</ToolsPanelItem>
					{ ! isEmpty && (
						<>
							<ToolsPanelItem
								hasValue={ () => hasHeader }
								label={ __( 'Header section' ) }
								onDeselect={ onToggleHeaderSection }
								isShownByDefault
							>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Header section' ) }
									checked={ hasHeader }
									onChange={ onToggleHeaderSection }
								/>
							</ToolsPanelItem>
							<ToolsPanelItem
								hasValue={ () => hasFooter }
								label={ __( 'Footer section' ) }
								onDeselect={ onToggleFooterSection }
								isShownByDefault
							>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Footer section' ) }
									checked={ hasFooter }
									onChange={ onToggleFooterSection }
								/>
							</ToolsPanelItem>
						</>
					) }
				</ToolsPanel>
			</InspectorControls>
			{ isEmpty ? (
				<Placeholder
					label={ __( 'Table' ) }
					icon={ <BlockIcon icon={ icon } showColors /> }
					instructions={ __( 'Insert a table for sharing data.' ) }
				>
					<form
						className="blocks-table__placeholder-form"
						onSubmit={ onCreateTable }
					>
						<TextControl
							__next40pxDefaultSize
							type="number"
							label={ __( 'Column count' ) }
							value={ initialColumnCount }
							onChange={ setInitialColumnCount }
							min="1"
							className="blocks-table__placeholder-input"
						/>
						<TextControl
							__next40pxDefaultSize
							type="number"
							label={ __( 'Row count' ) }
							value={ initialRowCount }
							onChange={ setInitialRowCount }
							min="1"
							className="blocks-table__placeholder-input"
						/>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
						>
							{ __( 'Create Table' ) }
						</Button>
					</form>
				</Placeholder>
			) : (
				<table { ...innerBlocksProps }>
					{ sections.map( ( section ) => (
						<TSection name={ section.name } key={ section.name }>
							{ section.rows.map( ( row, rowIndex ) => (
								<tr key={ rowIndex }>
									{ row.map(
										( cell ) =>
											itemsByClientId[ cell.clientId ]
									) }
								</tr>
							) ) }
						</TSection>
					) ) }
				</table>
			) }
		</figure>
	);
}
