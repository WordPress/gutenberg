/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	Warning,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { CommentsPaginationArrowControls } from './comments-pagination-arrow-controls';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const TEMPLATE = [
	[ 'core/comments-pagination-previous' ],
	[ 'core/comments-pagination-numbers' ],
	[ 'core/comments-pagination-next' ],
];

export default function QueryPaginationEdit( {
	attributes: { paginationArrow },
	setAttributes,
	clientId,
} ) {
	const hasNextPreviousBlocks = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		const innerBlocks = getBlocks( clientId );
		/**
		 * Show the `paginationArrow` control only if a
		 * Comments Pagination Next or Comments Pagination Previous
		 * block exists.
		 */
		return innerBlocks?.find( ( innerBlock ) => {
			return [
				'core/comments-pagination-previous',
				'core/comments-pagination-next',
			].includes( innerBlock.name );
		} );
	}, [] );

	const blockProps = useBlockProps();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	// Get the Discussion settings
	const pageComments = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		return __experimentalDiscussionSettings?.pageComments;
	}, [] );

	// If paging comments is not enabled in the Discussion Settings then hide the pagination
	// controls. We don't want to remove them from the template so that when the user enables
	// paging comments, the controls will be visible.
	if ( ! pageComments ) {
		return (
			<Warning>
				{ __(
					'Comments Pagination block: paging comments is disabled in the Discussion Settings'
				) }
			</Warning>
		);
	}

	return (
		<>
			{ hasNextPreviousBlocks && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Settings' ) }
						dropdownMenuProps={ dropdownMenuProps }
						resetAll={ () =>
							setAttributes( { paginationArrow: 'none' } )
						}
					>
						<ToolsPanelItem
							label={ __( 'Arrow' ) }
							hasValue={ () => paginationArrow !== 'none' }
							onDeselect={ () =>
								setAttributes( { paginationArrow: 'none' } )
							}
							isShownByDefault
						>
							<CommentsPaginationArrowControls
								value={ paginationArrow }
								onChange={ ( value ) => {
									setAttributes( { paginationArrow: value } );
								} }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>
			) }
			<div { ...innerBlocksProps } />
		</>
	);
}
