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
import { useMemo, useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab-panel/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab-panel/remove-tab-toolbar-control';

const EMPTY_ARRAY = [];

function Edit( { attributes, clientId, context } ) {
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

	const effectiveActiveIndex = useMemo( () => {
		return editorActiveTabIndex ?? activeTabIndex;
	}, [ editorActiveTabIndex, activeTabIndex ] );

	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const handleTabClick = useCallback(
		( tabIndex ) => {
			if ( tabsClientId && tabIndex !== effectiveActiveIndex ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( tabsClientId, {
					editorActiveTabIndex: tabIndex,
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

	const handleLabelChange = useCallback(
		( tabIndex, newLabel ) => {
			const tab = tabsList[ tabIndex ];
			if ( tab?.clientId ) {
				updateBlockAttributes( tab.clientId, { label: newLabel } );
			}
		},
		[ tabsList, updateBlockAttributes ]
	);

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

		if ( tabsList.length > prevCount ) {
			// Tab added — focus the last (newly added) button.
			focusButtonAt( tabsList.length - 1 );
		} else {
			// Tab removed — focus the new active button.
			focusButtonAt( effectiveActiveIndex );
		}
	}, [ tabsList.length, effectiveActiveIndex ] );

	const blockProps = useBlockProps( {
		role: 'tablist',
		ref: menuRef,
	} );

	const buttonClassName = clsx( colorProps.className, borderProps.className );

	const buttonStyle = {
		...colorProps.style,
		...borderProps.style,
		...spacingProps.style,
	};

	return (
		<>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
			<div { ...blockProps }>
				{ tabsList.map( ( tab, index ) => {
					const isActive = index === effectiveActiveIndex;
					return (
						<button
							key={ tab.clientId || index }
							type="button"
							className={ clsx( buttonClassName, {
								'is-active': isActive,
							} ) }
							style={ buttonStyle }
							tabIndex={ -1 }
							onClick={ ( event ) => {
								event.preventDefault();
								handleTabClick( index );
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
