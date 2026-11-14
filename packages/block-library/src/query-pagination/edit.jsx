import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { QueryPaginationArrowControls } from './query-pagination-arrow-controls';
import { QueryPaginationLabelControl } from './query-pagination-label-control';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function QueryPaginationEdit( {
	attributes: { paginationArrow, showLabel },
	setAttributes,
	clientId,
} ) {
	const hasNextPreviousBlocks = useSelect(
		( select ) => {
			const { getBlocks } = select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );
			/**
			 * Show the `paginationArrow` and `showLabel` controls only if a
			 * `QueryPaginationNext/Previous` block exists.
			 */
			return innerBlocks?.find( ( innerBlock ) => {
				return [
					'core/query-pagination-next',
					'core/query-pagination-previous',
				].includes( innerBlock.name );
			} );
		},
		[ clientId ]
	);
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps );

	return (
		<>
			{ hasNextPreviousBlocks && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () => {
							setAttributes( {
								paginationArrow: 'none',
								showLabel: true,
							} );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							hasValue={ () => paginationArrow !== 'none' }
							label={ __( 'Pagination arrow' ) }
							onDeselect={ () =>
								setAttributes( {
									paginationArrow: 'none',
									showLabel: true,
								} )
							}
							isShownByDefault
						>
							<QueryPaginationArrowControls
								value={ paginationArrow }
								onChange={ ( value ) => {
									// Without an arrow, the label is all the links show.
									setAttributes( {
										paginationArrow: value,
										...( value === 'none' && {
											showLabel: true,
										} ),
									} );
								} }
							/>
						</ToolsPanelItem>
						{ paginationArrow !== 'none' && (
							<ToolsPanelItem
								hasValue={ () => ! showLabel }
								label={ __( 'Show text' ) }
								onDeselect={ () =>
									setAttributes( { showLabel: true } )
								}
								isShownByDefault
							>
								<QueryPaginationLabelControl
									value={ showLabel }
									onChange={ ( value ) => {
										setAttributes( { showLabel: value } );
									} }
								/>
							</ToolsPanelItem>
						) }
					</ToolsPanel>
				</InspectorControls>
			) }
			<nav { ...innerBlocksProps } />
		</>
	);
}
