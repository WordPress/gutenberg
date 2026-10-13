import {
	BlockControls,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { createBlock, __unstableSerializeAndClean } from '@wordpress/blocks';
import {
	Spinner,
	SelectControl as WCSelectControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalConfirmDialog as ConfirmDialog,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useState } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { useDisabled } from '@wordpress/compose';
import { useServerSideRender } from '@wordpress/server-side-render';
import {
	formatListBullets,
	formatListBulletsRTL,
	formatListNumbered,
	formatListNumberedRTL,
} from '@wordpress/icons';
import { createListItemBlocks, linearToNestedHeadingList } from './utils';
import { useObserveHeadings } from './hooks';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';

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

/**
 * Table of Contents block edit component.
 *
 * @param {Object}                       props                     The props.
 * @param {Object}                       props.attributes          The block attributes.
 * @param {HeadingData[]}                props.attributes.headings The list of data for each heading in the post.
 * @param {number|undefined}             props.attributes.maxLevel The maximum heading level to include, or null to include all levels.
 * @param {boolean}                      props.attributes.ordered  Whether to display as an ordered list (true) or unordered list (false).
 * @param {string}                       props.clientId            The client id.
 * @param {string}                       props.name                The block name.
 * @param {Object}                       props.context             The block context.
 * @param {number}                       props.context.postId      The post ID.
 * @param {string}                       props.context.postType    The post type.
 * @param {(attributes: Object) => void} props.setAttributes       The set attributes function.
 *
 * @return {Component} The component.
 */
export default function TableOfContentsEdit( props ) {
	const {
		attributes,
		clientId,
		name,
		context: { postId, postType } = {},
		setAttributes,
	} = props;
	const { headings = [], maxLevel, ordered = true } = attributes;
	useObserveHeadings( clientId );

	const editorContent = useSelect(
		( select ) => {
			if ( ! postId || ! postType ) {
				return undefined;
			}

			// Use the edited entity to ensure unsaved content is included in the table of contents previews.
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			if ( typeof record?.content === 'function' ) {
				return record.content( record );
			}
			if ( record?.blocks ) {
				return __unstableSerializeAndClean( record.blocks );
			}
			const editedContent = record?.content;
			return typeof editedContent === 'string'
				? editedContent
				: editedContent?.raw;
		},
		[ postId, postType ]
	);

	const { content, status, error } = useServerSideRender( {
		attributes,
		block: name,
		httpMethod: 'POST',
		postContent: editorContent,
		urlQueryArgs: { post_id: postId },
	} );
	const [ previousContent, setPreviousContent ] = useState();
	useEffect( () => {
		if ( status === 'success' ) {
			// Remember empty responses too, so removing the last heading does
			// not leave the old list visible on the next request.
			setPreviousContent( content ?? '' );
		}
	}, [ content, status ] );
	const previewContent = status === 'success' ? content : previousContent;

	const disabledRef = useDisabled();
	const blockProps = useBlockProps( { ref: disabledRef } );
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
						maxLevel: undefined,
						ordered: true,
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					hasValue={ () => !! maxLevel }
					label={ __( 'Limit heading levels' ) }
					onDeselect={ () =>
						setAttributes( { maxLevel: undefined } )
					}
					isShownByDefault
				>
					<WCSelectControl
						label={ __( 'Maximum heading level' ) }
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
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);

	return (
		<>
			{ status === 'loading' && previousContent === undefined && (
				<div { ...blockProps }>
					<Spinner />
				</div>
			) }
			{ status === 'error' && (
				<div { ...blockProps }>
					<p>
						{ sprintf(
							/* translators: %s: error message returned when rendering the block. */
							__( 'Error: %s' ),
							error
						) }
					</p>
				</div>
			) }
			{ status !== 'error' && previewContent !== undefined && (
				<HtmlRenderer
					wrapperProps={ blockProps }
					html={ previewContent }
				/>
			) }
			{ headings.length > 0 && toolbarControls }
			{ inspectorControls }
		</>
	);
}
