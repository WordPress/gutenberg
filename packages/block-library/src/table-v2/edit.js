import clsx from 'clsx';
import { useState } from '@wordpress/element';
import {
	InspectorControls,
	BlockIcon,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	__experimentalUseColorProps as useColorProps,
	__experimentalUseBorderProps as useBorderProps,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Placeholder,
	ToggleControl,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { blockTable as icon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';
import { InputControl } from '@wordpress/ui';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

function createTableSection( type, rowCount, columnCount ) {
	const sectionTag = type === 'head' ? 'th' : 'td';
	const sectionScope = type === 'head' ? 'col' : undefined;

	const rows = [];
	for ( let rowIndex = 0; rowIndex < rowCount; rowIndex++ ) {
		const cells = [];
		for ( let colIndex = 0; colIndex < columnCount; colIndex++ ) {
			cells.push(
				createBlock( 'core/table-v2-cell', {
					tag: sectionTag,
					scope: sectionScope,
					content: '',
				} )
			);
		}
		rows.push( createBlock( 'core/table-v2-row', {}, cells ) );
	}

	return createBlock( 'core/table-v2-section', { type }, rows );
}

export default function TableEdit( { attributes, setAttributes, clientId } ) {
	const { hasFixedLayout } = attributes;
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

	const isEmpty = innerBlocks.length === 0;
	const hasHeader = innerBlocks.some(
		( block ) =>
			block.name === 'core/table-v2-section' &&
			block.attributes.type === 'head'
	);
	const hasFooter = innerBlocks.some(
		( block ) =>
			block.name === 'core/table-v2-section' &&
			block.attributes.type === 'foot'
	);

	function onCreateTable( event ) {
		event.preventDefault();
		const nextColumnCount = parseInt( initialColumnCount, 10 ) || 2;
		const nextRowCount = parseInt( initialRowCount, 10 ) || 2;

		const sections = [];
		if ( hasHeader ) {
			sections.push( createTableSection( 'head', 1, nextColumnCount ) );
		}
		sections.push(
			createTableSection( 'body', nextRowCount, nextColumnCount )
		);
		if ( hasFooter ) {
			sections.push( createTableSection( 'foot', 1, nextColumnCount ) );
		}

		replaceInnerBlocks( clientId, sections, true );
	}

	function onToggleHeaderSection() {
		if ( hasHeader ) {
			// Remove head section.
			const nextBlocks = innerBlocks.filter(
				( block ) =>
					! (
						block.name === 'core/table-v2-section' &&
						block.attributes.type === 'head'
					)
			);
			replaceInnerBlocks( clientId, nextBlocks, false );
		} else {
			// Add head section at the start.
			const columnCount =
				innerBlocks[ 0 ]?.innerBlocks[ 0 ]?.innerBlocks?.length || 2;
			const headSection = createTableSection( 'head', 1, columnCount );
			replaceInnerBlocks(
				clientId,
				[ headSection, ...innerBlocks ],
				false
			);
		}
	}

	function onToggleFooterSection() {
		if ( hasFooter ) {
			// Remove foot section.
			const nextBlocks = innerBlocks.filter(
				( block ) =>
					! (
						block.name === 'core/table-v2-section' &&
						block.attributes.type === 'foot'
					)
			);
			replaceInnerBlocks( clientId, nextBlocks, false );
		} else {
			// Add foot section at the end.
			const columnCount =
				innerBlocks[ 0 ]?.innerBlocks[ 0 ]?.innerBlocks?.length || 2;
			const footSection = createTableSection( 'foot', 1, columnCount );
			replaceInnerBlocks(
				clientId,
				[ ...innerBlocks, footSection ],
				false
			);
		}
	}

	function onChangeFixedLayout() {
		setAttributes( { hasFixedLayout: ! hasFixedLayout } );
	}

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
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
			allowedBlocks: [ 'core/table-v2-section' ],
			renderAppender: false,
			__unstableDisableDropZone: true,
			__experimentalCaptureToolbars: true,
		}
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
						<InputControl
							type="number"
							label={ __( 'Column count' ) }
							value={ initialColumnCount }
							onValueChange={ setInitialColumnCount }
							min="1"
							className="blocks-table__placeholder-input"
						/>
						<InputControl
							type="number"
							label={ __( 'Row count' ) }
							value={ initialRowCount }
							onValueChange={ setInitialRowCount }
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
				<table { ...innerBlocksProps } />
			) }
		</figure>
	);
}
