/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import {
	InspectorControls,
	BlockIcon,
	useBlockProps,
	useInnerBlocksProps,
	useInnerBlockItems,
	store as blockEditorStore,
	__experimentalUseColorProps as useColorProps,
	__experimentalUseBorderProps as useBorderProps,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Placeholder,
	TextControl,
	ToggleControl,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { blockTable as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { createTable, mapCellsToSections, toggleSection } from './utils';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

function TSection( { name, ...props } ) {
	const TagName = `t${ name }`;
	return <TagName { ...props } />;
}

export default function TableEdit( { attributes, setAttributes, clientId } ) {
	const { columnCount, hasFixedLayout, rows } = attributes;
	const [ initialRowCount, setInitialRowCount ] = useState( 2 );
	const [ initialColumnCount, setInitialColumnCount ] = useState( 2 );

	const colorProps = useColorProps( attributes );
	const borderProps = useBorderProps( attributes );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const innerBlocks = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlocks( clientId );
		},
		[ clientId ]
	);

	const isEmpty = rows.length === 0 || innerBlocks.length === 0;
	const hasHeader = rows.some( ( row ) => row.type === 'head' );
	const hasFooter = rows.some( ( row ) => row.type === 'foot' );

	// Structural operations: these replace the entire inner blocks array.
	function replaceTable( nextTable ) {
		setAttributes( { rows: nextTable.rows } );
		replaceInnerBlocks( clientId, nextTable.cells, false );
	}

	function onCreateTable( event ) {
		event.preventDefault();
		const nextColumnCount = parseInt( initialColumnCount, 10 ) || 2;
		const nextTable = createTable( {
			rowCount: parseInt( initialRowCount, 10 ) || 2,
			columnCount: nextColumnCount,
		} );
		setAttributes( {
			columnCount: nextColumnCount,
			rows: nextTable.rows,
		} );
		replaceInnerBlocks( clientId, nextTable.cells, true );
	}

	function onToggleHeaderSection() {
		replaceTable(
			toggleSection( rows, innerBlocks, {
				type: 'head',
				columnCount,
			} )
		);
	}

	function onToggleFooterSection() {
		replaceTable(
			toggleSection( rows, innerBlocks, {
				type: 'foot',
				columnCount,
			} )
		);
	}

	function onChangeFixedLayout() {
		setAttributes( { hasFixedLayout: ! hasFixedLayout } );
	}

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
		() => mapCellsToSections( rows, innerBlocks ),
		[ rows, innerBlocks ]
	);

	return (
		<figure { ...blockProps }>
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
