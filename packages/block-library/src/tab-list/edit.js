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
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TabToolbarControls from '../tab-panel/tab-toolbar-controls';

const EMPTY_ARRAY = [];

function Edit( {
	attributes,
	clientId,
	context,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const tabsList = context[ 'core/tabs-list' ] || EMPTY_ARRAY;

	const colorProps = useColorProps( attributes );
	const borderProps = useBorderProps( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );

	const { tabsClientId, editorActiveTabIndex, activeTabIndex } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockAttributes } =
				select( blockEditorStore );

			const _tabsClientId = getBlockRootClientId( clientId );
			const tabsAttributes = _tabsClientId
				? getBlockAttributes( _tabsClientId )
				: {};

			return {
				tabsClientId: _tabsClientId,
				editorActiveTabIndex: tabsAttributes?.editorActiveTabIndex,
				activeTabIndex: tabsAttributes?.activeTabIndex ?? 0,
			};
		},
		[ clientId ]
	);

	const effectiveActiveIndex = editorActiveTabIndex ?? activeTabIndex;

	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	function selectTabPanel( tabIndex ) {
		if ( tabsClientId && tabIndex !== effectiveActiveIndex ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: tabIndex,
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
	const prevTabCountRef = useRef( tabsList.length );

	// When tabs are added or removed, focus the appropriate button.
	useEffect( () => {
		const prevCount = prevTabCountRef.current;
		prevTabCountRef.current = tabsList.length;

		if ( ! menuRef.current || tabsList.length === prevCount ) {
			return;
		}

		const focusButtonAt = ( index ) => {
			window.requestAnimationFrame( () => {
				const buttons = menuRef.current?.querySelectorAll( 'button' );
				const target = buttons?.[ index ];
				if ( ! target ) {
					return;
				}
				const richText = target.querySelector( '[contenteditable]' );
				if ( richText ) {
					richText.focus();
				} else {
					target.focus();
				}
			} );
		};

		focusButtonAt( effectiveActiveIndex );
	}, [ tabsList.length, effectiveActiveIndex ] );

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
							/>
						</button>
					);
				} ) }
			</div>
		</>
	);
}

export default Edit;
