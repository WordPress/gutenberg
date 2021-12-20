/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, VisuallyHidden } from '@wordpress/components';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { close } from '@wordpress/icons';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function InserterSidebar() {
	const { setIsInserterOpened } = useDispatch( editSiteStore );
	const insertionPoint = useSelect(
		( select ) => select( editSiteStore ).__experimentalGetInsertionPoint(),
		[]
	);

	const isMobile = useViewportMatch( 'medium', '<' );
	const TagName = ! isMobile ? VisuallyHidden : 'div';
	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: () => setIsInserterOpened( false ),
		focusOnMount: null,
	} );

	const inserterContentRef = useRef();
	useEffect( () => {
		inserterContentRef.current
			.querySelector( '.block-editor-inserter__search input' )
			.focus();
	}, [] );

	return (
		<div
			ref={ inserterDialogRef }
			{ ...inserterDialogProps }
			className="edit-site-editor__inserter-panel"
		>
			<TagName className="edit-post-editor__inserter-panel-header">
				<Button
					icon={ close }
					label={ __( 'Close block inserter' ) }
					onClick={ () => setIsInserterOpened( false ) }
				/>
			</TagName>
			<div
				className="edit-post-editor__inserter-panel-content"
				ref={ inserterContentRef }
			>
				<Library
					showInserterHelpPanel
					shouldFocusBlock={ isMobile }
					rootClientId={ insertionPoint.rootClientId }
					__experimentalInsertionIndex={
						insertionPoint.insertionIndex
					}
					__experimentalFilterValue={ insertionPoint.filterValue }
				/>
			</div>
		</div>
	);
}
