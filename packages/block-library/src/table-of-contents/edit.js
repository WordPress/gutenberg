/**
 * WordPress dependencies
 */
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	Placeholder,
	ToggleControl,
	SelectControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalConfirmDialog as ConfirmDialog,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { store as noticeStore } from '@wordpress/notices';
import {
	tableOfContents as icon,
	formatListBullets,
	formatListBulletsRTL,
	formatListNumbered,
	formatListNumberedRTL,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TableOfContentsList from './list';
import { createListItemBlocks, linearToNestedHeadingList } from './utils';
import { useObserveHeadings } from './hooks';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

/** @typedef {import('./utils').HeadingData} HeadingData */

function TableOfContentsToolbar( {
	clientId,
	headingTree,
	ordered,
	setAttributes,
} ) {
	const canInsertList = useSelect(
		( select ) => {
			const { getBlockRootClientId, canInsertBlockType } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );

			return canInsertBlockType( 'core/list', rootClientId );
		},
		[ clientId ]
	);
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const [ isConfirmingDetach, setIsConfirmingDetach ] = useState( false );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={
							isRTL() ? formatListBulletsRTL : formatListBullets
						}
						title={ __( 'Unordered' ) }
						description={ __( 'Convert to unordered list' ) }
						onClick={ () => setAttributes( { ordered: false } ) }
						isActive={ ordered === false }
					/>
					<ToolbarButton
						icon={
							isRTL() ? formatListNumberedRTL : formatListNumbered
						}
						title={ __( 'Ordered' ) }
						description={ __( 'Convert to ordered list' ) }
						onClick={ () => setAttributes( { ordered: true } ) }
						isActive={ ordered === true }
					/>
				</ToolbarGroup>
				{ canInsertList && (
					<ToolbarGroup>
						<ToolbarButton
							onClick={ () => setIsConfirmingDetach( true ) }
						>
							{ __( 'Detach' ) }
						</ToolbarButton>
					</ToolbarGroup>
				) }
			</BlockControls>
			{ isConfirmingDetach && (
				<ConfirmDialog
					isOpen
					title={ __( 'Detach Table of Contents' ) }
					__experimentalHideHeader={ false }
					confirmButtonText={ __( 'Detach' ) }
					onConfirm={ () => {
						setIsConfirmingDetach( false );
						replaceBlocks(
							clientId,
							createBlock(
								'core/list',
								{ ordered },
								createListItemBlocks( headingTree, ordered )
							)
						);
					} }
					onCancel={ () => setIsConfirmingDetach( false ) }
					size="medium"
				>
					{ __(
						'The Table of Contents block lists the headings in the post. Detaching will enable you to edit, reorder, or remove entries. However, new headings will no longer be added automatically.'
					) }
				</ConfirmDialog>
			) }
		</>
	);
}

export default function TableOfContentsEdit( {
	attributes: {
		headings = [],
		onlyIncludeCurrentPage,
		maxLevel,
		ordered = true,
	},
	clientId,
	setAttributes,
} ) {
	useObserveHeadings( clientId );

	const blockProps = useBlockProps();
	const instanceId = useInstanceId(
		TableOfContentsEdit,
		'table-of-contents'
	);

	// If a user clicks to a link prevent redirection and show a warning.
	const { createWarningNotice } = useDispatch( noticeStore );
	const showRedirectionPreventedNotice = ( event ) => {
		event.preventDefault();
		createWarningNotice( __( 'Links are disabled in the editor.' ), {
			id: `block-library/core/table-of-contents/redirection-prevented/${ instanceId }`,
			type: 'snackbar',
		} );
	};

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const headingTree = linearToNestedHeadingList( headings );

	const toolbarControls = (
		<TableOfContentsToolbar
			clientId={ clientId }
			headingTree={ headingTree }
			ordered={ ordered }
			setAttributes={ setAttributes }
		/>
	);

	const inspectorControls = (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () => {
					setAttributes( {
						onlyIncludeCurrentPage: false,
						maxLevel: undefined,
						ordered: true,
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					hasValue={ () => !! onlyIncludeCurrentPage }
					label={ __( 'Only include current page' ) }
					onDeselect={ () =>
						setAttributes( { onlyIncludeCurrentPage: false } )
					}
					isShownByDefault
				>
					<ToggleControl
						label={ __( 'Only include current page' ) }
						checked={ onlyIncludeCurrentPage }
						onChange={ ( value ) =>
							setAttributes( { onlyIncludeCurrentPage: value } )
						}
						help={
							onlyIncludeCurrentPage
								? __(
										'Only including headings from the current page (if the post is paginated).'
								  )
								: __(
										'Include headings from all pages (if the post is paginated).'
								  )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={ () => !! maxLevel }
					label={ __( 'Limit heading levels' ) }
					onDeselect={ () =>
						setAttributes( { maxLevel: undefined } )
					}
					isShownByDefault
				>
					<SelectControl
						label={ __( 'Include headings down to level' ) }
						value={ maxLevel || '' }
						options={ [
							{ value: '', label: __( 'All levels' ) },
							{ value: '1', label: __( 'Heading 1' ) },
							{ value: '2', label: __( 'Heading 2' ) },
							{ value: '3', label: __( 'Heading 3' ) },
							{ value: '4', label: __( 'Heading 4' ) },
							{ value: '5', label: __( 'Heading 5' ) },
							{ value: '6', label: __( 'Heading 6' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( {
								maxLevel: value ? parseInt( value ) : undefined,
							} )
						}
						help={
							! maxLevel
								? __(
										'Including all heading levels in the table of contents.'
								  )
								: __(
										'Only include headings up to and including this level.'
								  )
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);

	// If there are no headings or the only heading is empty.
	// Note that the toolbar controls are intentionally omitted since the
	// "Detach" option is useless to the placeholder state.
	if ( headings.length === 0 ) {
		return (
			<>
				<div { ...blockProps }>
					<Placeholder
						icon={ <BlockIcon icon={ icon } /> }
						label={ __( 'Table of Contents' ) }
						instructions={ __(
							'Start adding Heading blocks to create a table of contents. Headings with HTML anchors will be linked here.'
						) }
					/>
				</div>
				{ inspectorControls }
			</>
		);
	}

	const ListTag = ordered ? 'ol' : 'ul';

	return (
		<>
			<nav { ...blockProps }>
				<ListTag>
					<TableOfContentsList
						nestedHeadingList={ headingTree }
						disableLinkActivation
						onClick={ showRedirectionPreventedNotice }
						ordered={ ordered }
					/>
				</ListTag>
			</nav>
			{ toolbarControls }
			{ inspectorControls }
		</>
	);
}
