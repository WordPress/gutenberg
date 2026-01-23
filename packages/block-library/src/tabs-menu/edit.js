/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	BlockContextProvider,
	__experimentalUseBlockPreview as useBlockPreview,
	store as blockEditorStore,
	useBlockEditContext,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	memo,
	useMemo,
	useState,
	useEffect,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab/remove-tab-toolbar-control';

const TABS_MENU_ITEM_TEMPLATE = [ [ 'core/tabs-menu-item', {} ] ];

/**
 * Preview component for non-active tab menu items.
 * Uses useBlockPreview to cache the rendering.
 *
 * @param {Object}   props                         Component props.
 * @param {Array}    props.blocks                  The blocks to preview.
 * @param {string}   props.blockContextId          The context ID for this block.
 * @param {boolean}  props.isHidden                Whether the preview is hidden.
 * @param {Function} props.setActiveBlockContextId Callback to set the active context ID.
 */
function TabsMenuItemPreview( {
	blocks,
	blockContextId,
	isHidden,
	setActiveBlockContextId,
} ) {
	const blockPreviewProps = useBlockPreview( { blocks } );

	const handleOnClick = () => {
		setActiveBlockContextId( blockContextId );
	};

	const style = {
		display: isHidden ? 'none' : 'flex',
	};

	return (
		<div
			{ ...blockPreviewProps }
			tabIndex={ 0 }
			role="button"
			onClick={ handleOnClick }
			onKeyDown={ handleOnClick }
			style={ style }
		/>
	);
}

const MemoizedTabsMenuItemPreview = memo( TabsMenuItemPreview );

/**
 * The actual editable inner blocks for the active tab item.
 *
 * @param {Object} props              Component props.
 * @param {Object} props.wrapperProps Props to pass to the wrapper element.
 * @param {Object} props.layout       The layout object to pass to inner blocks.
 */
function TabsMenuItemTemplateBlocks( { wrapperProps = {}, layout } ) {
	const innerBlocksProps = useInnerBlocksProps( wrapperProps, {
		template: TABS_MENU_ITEM_TEMPLATE,
		templateLock: 'all',
		renderAppender: false,
		layout,
	} );
	return innerBlocksProps.children;
}

function Edit( {
	context,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	// Get the layout from block edit context to pass to inner blocks.
	// This ensures the correct orientation is used from the start.
	const { layout } = useBlockEditContext();

	const tabsId = context[ 'core/tabs-id' ] || null;
	const tabsList = context[ 'core/tabs-list' ] || [];
	const activeTabIndex = context[ 'core/tabs-activeTabIndex' ] ?? 0;
	const editorActiveTabIndex = context[ 'core/tabs-editorActiveTabIndex' ];

	// Memoize effectiveActiveIndex to ensure it updates when context changes
	const effectiveActiveIndex = useMemo( () => {
		return editorActiveTabIndex ?? activeTabIndex;
	}, [ editorActiveTabIndex, activeTabIndex ] );

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Track which tab context is "active" for editing (shows real inner blocks)
	const [ activeBlockContextId, setActiveBlockContextId ] = useState( null );

	// Get the inner blocks (the single tabs-menu-item template)
	const { blocks, tabsClientId } = useSelect(
		( select ) => {
			const { getBlocks, getBlockRootClientId } =
				select( blockEditorStore );
			return {
				blocks: getBlocks( clientId ),
				tabsClientId: getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);

	// Build block contexts for each tab
	const blockContexts = useMemo( () => {
		return tabsList.map( ( tab, index ) => ( {
			'core/tabs-menu-item-index': index,
			'core/tabs-menu-item-id': tab.id || `tab-${ index }`,
			'core/tabs-menu-item-label': tab.label || '',
			'core/tabs-menu-item-clientId': tab.clientId,
			// Pass through parent context
			'core/tabs-id': tabsId,
			'core/tabs-list': tabsList,
			'core/tabs-activeTabIndex': activeTabIndex,
			'core/tabs-editorActiveTabIndex': editorActiveTabIndex,
		} ) );
	}, [ tabsList, tabsId, activeTabIndex, editorActiveTabIndex ] );

	// Generate a unique ID for each block context
	const getContextId = useCallback( ( blockContext ) => {
		return `tab-context-${ blockContext[ 'core/tabs-menu-item-index' ] }`;
	}, [] );

	// Set the first tab as active by default
	useEffect( () => {
		if ( blockContexts.length > 0 && activeBlockContextId === null ) {
			setActiveBlockContextId( getContextId( blockContexts[ 0 ] ) );
		}
	}, [ blockContexts, activeBlockContextId, getContextId ] );

	// Update active context when editorActiveTabIndex changes
	useEffect( () => {
		if (
			blockContexts.length > 0 &&
			effectiveActiveIndex < blockContexts.length
		) {
			const newContextId = getContextId(
				blockContexts[ effectiveActiveIndex ]
			);
			setActiveBlockContextId( ( prevId ) =>
				prevId !== newContextId ? newContextId : prevId
			);
		}
	}, [ effectiveActiveIndex, blockContexts, getContextId ] );

	// Handle tab click to update parent tabs block's editorActiveTabIndex
	const handleTabContextClick = useCallback(
		( index ) => {
			if ( tabsClientId && index !== effectiveActiveIndex ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( tabsClientId, {
					editorActiveTabIndex: index,
				} );
			}
		},
		[
			tabsClientId,
			effectiveActiveIndex,
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		]
	);

	const blockProps = useBlockProps( {
		className: clsx( layoutClassNames ),
		role: 'tablist',
	} );

	// If no tabs exist yet, show placeholder
	if ( tabsList.length === 0 ) {
		return (
			<>
				<AddTabToolbarControl tabsClientId={ tabsClientId } />
				<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
				<div { ...blockProps }>
					<span className="tabs__tab-label tabs__tab-label--placeholder">
						{ __( 'Add tabs to display menu' ) }
					</span>
				</div>
			</>
		);
	}

	return (
		<>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
			<div { ...blockProps }>
				{ blockContexts.map( ( blockContext, index ) => {
					const contextId = getContextId( blockContext );
					const isVisible = contextId === activeBlockContextId;

					return (
						<BlockContextProvider
							key={ contextId }
							value={ blockContext }
						>
							{ isVisible ? (
								<TabsMenuItemTemplateBlocks
									wrapperProps={ {
										onClick: () =>
											handleTabContextClick( index ),
									} }
									layout={ layout }
								/>
							) : null }
							<MemoizedTabsMenuItemPreview
								blocks={ blocks }
								blockContextId={ contextId }
								setActiveBlockContextId={ ( id ) => {
									setActiveBlockContextId( id );
									handleTabContextClick( index );
								} }
								isHidden={ isVisible }
							/>
						</BlockContextProvider>
					);
				} ) }
			</div>
		</>
	);
}

export default Edit;
