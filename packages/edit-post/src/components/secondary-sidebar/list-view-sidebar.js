/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalListView as ListView,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import {
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { ESCAPE } from '@wordpress/keycodes';
import { useCallback, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import ListViewOutline from './list-view-outline';

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editPostStore );

	const { clientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientIds } = select( blockEditorStore );
		return {
			clientId: getSelectedBlockClientIds()[ 0 ],
		};
	} );

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const headerFocusReturnRef = useFocusReturn();
	const contentFocusReturnRef = useFocusReturn();
	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsListViewOpened( false );
		}
	}

	const [ tab, setTab ] = useState( 'list-view' );

	// This ref refers to the sidebar as a whole.
	const sidebarRef = useRef();
	const listViewButtonRef = useRef();
	const listViewContainerRef = useRef();
	const outlineButtonRef = useRef();

	const handleSidebarFocus = useCallback( () => {
		if ( tab === 'list-view' && listViewButtonRef?.current?.focus ) {
			if ( clientId && listViewContainerRef?.current ) {
				// If a block is selected, focus on the corresponding list view item.
				const blockElement = listViewContainerRef.current.querySelector(
					`[data-block="${ clientId }"] a`
				);
				if ( blockElement ) {
					blockElement.focus();
				}
			} else {
				// If a block is not selected, focus on the list view button.
				listViewButtonRef.current.focus();
			}
		} else if ( tab === 'outline' && outlineButtonRef?.current?.focus ) {
			// If the outline tab is selected, focus on the outline button.
			outlineButtonRef.current.focus();
		}
	}, [ clientId ] );

	useShortcut( 'core/edit-post/toggle-list-view', () => {
		if (
			sidebarRef.current.contains(
				sidebarRef.current.ownerDocument.activeElement
			)
		) {
			// If the sidebar has focus, it is safe to close.
			setIsListViewOpened( false );
		} else {
			// If the list view or outline does not have focus, focus should be moved to it.
			handleSidebarFocus();
		}
	} );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			aria-label={ __( 'Document Overview' ) }
			className="edit-post-editor__document-overview-panel"
			onKeyDown={ closeOnEscape }
			ref={ sidebarRef }
		>
			<div
				className="edit-post-editor__document-overview-panel-header components-panel__header edit-post-sidebar__panel-tabs"
				ref={ headerFocusReturnRef }
			>
				<Button
					icon={ closeSmall }
					label={ __( 'Close Document Overview Sidebar' ) }
					onClick={ () => setIsListViewOpened( false ) }
				/>
				<ul>
					<li>
						<Button
							onClick={ () => {
								setTab( 'list-view' );
							} }
							className={ classnames(
								'edit-post-sidebar__panel-tab',
								{ 'is-active': tab === 'list-view' }
							) }
							aria-current={ tab === 'list-view' }
							ref={ listViewButtonRef }
						>
							{ __( 'List View' ) }
						</Button>
					</li>
					<li>
						<Button
							onClick={ () => {
								setTab( 'outline' );
							} }
							className={ classnames(
								'edit-post-sidebar__panel-tab',
								{ 'is-active': tab === 'outline' }
							) }
							aria-current={ tab === 'outline' }
							ref={ outlineButtonRef }
						>
							{ __( 'Outline' ) }
						</Button>
					</li>
				</ul>
			</div>
			<div
				ref={ useMergeRefs( [
					contentFocusReturnRef,
					focusOnMountRef,
					listViewContainerRef,
				] ) }
				className="edit-post-editor__list-view-container"
			>
				{ tab === 'list-view' && (
					<div className="edit-post-editor__list-view-panel-content">
						<ListView />
					</div>
				) }
				{ tab === 'outline' && <ListViewOutline /> }
			</div>
		</div>
	);
}
