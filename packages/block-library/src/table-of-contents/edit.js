/**
 * WordPress dependencies
 */
import {
	BlockControls,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	Spinner,
	ToggleControl,
	SelectControl,
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

/**
 * Internal dependencies
 */
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
 * @param {Object}                       props                                   The props.
 * @param {Object}                       props.attributes                        The block attributes.
 * @param {HeadingData[]}                props.attributes.headings               The list of data for each heading in the post.
 * @param {boolean}                      props.attributes.onlyIncludeCurrentPage Whether to only include headings from the current page (if the post is paginated).
 * @param {number|undefined}             props.attributes.maxLevel               The maximum heading level to include, or null to include all levels.
 * @param {boolean}                      props.attributes.ordered                Whether to display as an ordered list (true) or unordered list (false).
 * @param {string}                       props.clientId                          The client id.
 * @param {string}                       props.name                              The block name.
 * @param {Object}                       props.context                           The block context.
 * @param {number}                       props.context.postId                    The post ID.
 * @param {string}                       props.context.postType                  The post type.
 * @param {(attributes: Object) => void} props.setAttributes                     The set attributes function.
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
	const {
		headings = [],
		onlyIncludeCurrentPage,
		maxLevel,
		ordered = true,
	} = attributes;
	useObserveHeadings( clientId );

	const post = useSelect(
		( select ) => {
			if ( ! postId || ! postType ) {
				return;
			}

			return select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			);
		},
		[ postId, postType ]
	);
	const [ invalidationKey, setInvalidationKey ] = useState( 0 );
	useEffect( () => {
		setInvalidationKey( ( value ) => value + 1 );
	}, [ post ] );

	const { content, status, error } = useServerSideRender( {
		attributes,
		block: name,
		urlQueryArgs: { post_id: postId, invalidationKey },
	} );
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

	return (
		<>
			{ status === 'loading' && (
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
			{ status === 'success' && (
				<HtmlRenderer wrapperProps={ blockProps } html={ content } />
			) }
			{ headings.length > 0 && toolbarControls }
			{ inspectorControls }
		</>
	);
}
