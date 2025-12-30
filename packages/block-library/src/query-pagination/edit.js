/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { QueryPaginationArrowControls } from './query-pagination-arrow-controls';
import { QueryPaginationLabelControl } from './query-pagination-label-control';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const TEMPLATE = [
	[ 'core/query-pagination-previous' ],
	[ 'core/query-pagination-numbers' ],
	[ 'core/query-pagination-next' ],
];

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
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	// Always show label text if paginationArrow is set to 'none'.
	useEffect( () => {
		if ( paginationArrow === 'none' && ! showLabel ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { showLabel: true } );
		}
	}, [
		paginationArrow,
		setAttributes,
		showLabel,
		__unstableMarkNextChangeAsNotPersistent,
	] );

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
								setAttributes( { paginationArrow: 'none' } )
							}
							isShownByDefault
						>
							<QueryPaginationArrowControls
								value={ paginationArrow }
								onChange={ ( value ) => {
									setAttributes( { paginationArrow: value } );
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
