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
import { useSelect } from '@wordpress/data';
import { PanelBody } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { QueryPaginationArrowControls } from './query-pagination-arrow-controls';
import { QueryPaginationLabelControl } from './query-pagination-label-control';

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
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );
	// Always show label text if paginationArrow is set to 'none'.
	useEffect( () => {
		if ( paginationArrow === 'none' && ! showLabel ) {
			setAttributes( { showLabel: true } );
		}
	}, [ paginationArrow, setAttributes, showLabel ] );
	return (
		<>
			{ hasNextPreviousBlocks && (
				<InspectorControls>
					<PanelBody title={ __( 'Settings' ) }>
						<QueryPaginationArrowControls
							value={ paginationArrow }
							onChange={ ( value ) => {
								setAttributes( { paginationArrow: value } );
							} }
						/>
						{ paginationArrow !== 'none' && (
							<QueryPaginationLabelControl
								value={ showLabel }
								onChange={ ( value ) => {
									setAttributes( { showLabel: value } );
								} }
							/>
						) }
					</PanelBody>
				</InspectorControls>
			) }
			<nav { ...innerBlocksProps } />
		</>
	);
}
