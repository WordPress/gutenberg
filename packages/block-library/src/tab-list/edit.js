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
	store as blockEditorStore,
	RichText,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
} from '@wordpress/block-editor';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TabToolbarControls from '../tabs/tab-toolbar-controls';
import useTabActions from '../tabs/use-tab-actions';

const EMPTY_ARRAY = [];

function Edit( {
	attributes,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const colorProps = useColorProps( attributes );
	const borderProps = useBorderProps( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );

	const { tabsClientId, tabPanels, editorActiveTabIndex, activeTabIndex } =
		useSelect(
			( select ) => {
				const { getBlockRootClientId, getBlockAttributes, getBlocks } =
					select( blockEditorStore );

				const rootClientId = getBlockRootClientId( clientId );
				const tabsAttributes = getBlockAttributes( rootClientId );
				const tabPanelsBlock = getBlocks( rootClientId )?.find(
					( block ) => block.name === 'core/tab-panels'
				);

				return {
					tabsClientId: rootClientId,
					tabPanels: tabPanelsBlock?.innerBlocks ?? EMPTY_ARRAY,
					editorActiveTabIndex: tabsAttributes?.editorActiveTabIndex,
					activeTabIndex: tabsAttributes?.activeTabIndex ?? 0,
				};
			},
			[ clientId ]
		);
	const registry = useRegistry();
	const { isBlockSelected, hasSelectedInnerBlock } =
		useSelect( blockEditorStore );
	const {
		updateBlockAttributes,
		selectBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const { insertTab, removeTab } = useTabActions( tabsClientId );

	const effectiveActiveIndex = editorActiveTabIndex ?? activeTabIndex;
	const tabsList = useMemo(
		() =>
			tabPanels.map( ( tab ) => ( {
				label: tab.attributes.label || '',
				clientId: tab.clientId,
			} ) ),
		[ tabPanels ]
	);

	function selectTabPanel( tabIndex ) {
		if ( tabsClientId && tabIndex !== effectiveActiveIndex ) {
			// Batch the selection and index update so the sync effect in
			// the tab-panel block can't revert the switch from a stale
			// inner-block selection in the previously active panel.
			registry.batch( () => {
				selectBlock( clientId );
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( tabsClientId, {
					editorActiveTabIndex: tabIndex,
				} );
			} );
		}
	}

	function handleLabelChange( tabIndex, newLabel ) {
		const tab = tabsList[ tabIndex ];
		if ( tab?.clientId ) {
			updateBlockAttributes( tab.clientId, { label: newLabel } );
		}
	}

	const menuRef = useRef();
	const prevTabIdsRef = useRef( tabsList.map( ( tab ) => tab.clientId ) );

	// When tabs are added or removed, focus the appropriate button.
	useEffect( () => {
		const prevTabIds = prevTabIdsRef.current;
		const tabIds = tabsList.map( ( tab ) => tab.clientId );
		prevTabIdsRef.current = tabIds;

		// Only react when a tab was actually added or removed.
		if ( ! menuRef.current || tabIds.length === prevTabIds.length ) {
			return;
		}

		// Only move focus during active editing, not external data changes.
		if (
			! isBlockSelected( tabsClientId ) &&
			! hasSelectedInnerBlock( tabsClientId, true )
		) {
			return;
		}

		const focusButtonAt = ( index ) => {
			window.requestAnimationFrame( () => {
				const button =
					menuRef.current?.querySelectorAll( 'button' )?.[ index ];
				(
					button?.querySelector( '[contenteditable]' ) ?? button
				)?.focus();
			} );
		};

		// The editor-only active index is a non-persistent attribute, so it
		// isn't restored on undo/redo. Derive the tab to activate from the
		// structural change.
		const addedTabIndex = tabIds.findIndex(
			( id ) => ! prevTabIds.includes( id )
		);
		let targetTabIndex;
		if ( addedTabIndex !== -1 ) {
			// A tab appeared (a new tab or undoing a removal): activate it.
			targetTabIndex = addedTabIndex;
		} else {
			// A tab disappeared (undoing an insertion or a removal): activate
			// the tab adjacent to the removed one.
			const removedTabIndex = prevTabIds.findIndex(
				( id ) => ! tabIds.includes( id )
			);
			targetTabIndex = Math.min( removedTabIndex, tabIds.length - 1 );
		}

		if ( targetTabIndex !== effectiveActiveIndex ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: targetTabIndex,
			} );
		}
		focusButtonAt( targetTabIndex );
	}, [
		effectiveActiveIndex,
		hasSelectedInnerBlock,
		isBlockSelected,
		tabsClientId,
		tabsList,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	const blockProps = useBlockProps( {
		role: 'tablist',
		ref: menuRef,
		// Applied manually since this block has no inner blocks for the layout
		// support to add its container classes to.
		className: layoutClassNames,
	} );

	const buttonClassName = clsx( colorProps.className, borderProps.className );

	const buttonStyle = {
		...colorProps.style,
		...borderProps.style,
		...spacingProps.style,
	};

	return (
		<>
			<TabToolbarControls tabsClientId={ tabsClientId } />
			<div { ...blockProps }>
				{ tabsList.map( ( tab, index ) => {
					const isActive = index === effectiveActiveIndex;
					return (
						<button
							key={ tab.clientId || index }
							type="button"
							role="tab"
							aria-selected={ isActive }
							className={ buttonClassName || undefined }
							style={ buttonStyle }
							tabIndex={ -1 }
							// Activate the matching panel whenever this tab
							// receives focus — whether from a click or the caret
							// moving into the label via the keyboard.
							onFocus={ () => {
								selectTabPanel( index );
							} }
						>
							<RichText
								tagName="span"
								withoutInteractiveFormatting
								placeholder={ __( 'Tab title' ) }
								value={ tab.label }
								onChange={ ( newLabel ) =>
									handleLabelChange( index, newLabel )
								}
								__unstableOnSplitAtEnd={ () =>
									insertTab( index + 1 )
								}
								onRemove={ () => removeTab( index ) }
							/>
						</button>
					);
				} ) }
			</div>
		</>
	);
}

export default Edit;
