import clsx from 'clsx';
import {
	useCallback,
	useRef,
	useState,
	useLayoutEffect,
} from '@wordpress/element';
import { useInstanceId, useResizeObserver } from '@wordpress/compose';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button as UIButton } from '@wordpress/ui';
import { __, _x, sprintf } from '@wordpress/i18n';
import { moreVertical, published } from '@wordpress/icons';
import { NoteCard } from './note-card';
import { truncateToFit } from './truncate-content';
import { NoteForm } from './note-form';
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

function NoteActionsMenu( { items, buttonRef } ) {
	return (
		<Menu placement="bottom-end">
			<Menu.TriggerButton
				render={
					<Button
						ref={ buttonRef }
						size="small"
						icon={ moreVertical }
						label={ __( 'Actions' ) }
						disabled={ ! items.length }
						accessibleWhenDisabled
					/>
				}
			/>
			<Menu.Popover
				// The menu popover is rendered in a portal, which causes focus to be
				// lost and the note to be collapsed unintentionally. To prevent this,
				// the popover should be rendered as an inline.
				modal={ false }
			>
				{ items.map( ( item ) => (
					<Menu.Item key={ item.id } onClick={ item.onClick }>
						<Menu.ItemLabel>{ item.title }</Menu.ItemLabel>
					</Menu.Item>
				) ) }
			</Menu.Popover>
		</Menu>
	);
}

export function Note( {
	note,
	parentNote,
	isSelected,
	onEditNote,
	onDeleteNote,
	onResolve,
} ) {
	const [ actionState, setActionState ] = useState( null );
	const actionButtonRef = useRef( null );

	const [ contentElement, setContentElement ] = useState( null );
	// The same element, for the imperative reads and writes below.
	const contentRef = useRef( null );
	const rawContent = note?.content?.raw;
	const [ prevContent, setPrevContent ] = useState( rawContent );
	const [ isExpanded, setIsExpanded ] = useState( false );
	/*
	 * `null` while the content still has to be measured, `false` once it is
	 * known to fit, and the truncated markup once it is known not to.
	 */
	const [ collapsedContent, setCollapsedContent ] = useState( null );
	const isOverflowing = typeof collapsedContent === 'string';
	const contentId = useInstanceId(
		Note,
		'editor-collab-sidebar-note-content'
	);

	// Collapse whenever the content changes so it can be re-measured.
	if ( prevContent !== rawContent ) {
		setPrevContent( rawContent );
		setIsExpanded( false );
		setCollapsedContent( null );
	}

	/*
	 * Cut the collapsed note down to the text that actually fits. Truncating
	 * rather than clipping keeps hidden text out of the tab order and out of
	 * the accessibility tree, so "Show more" hides what it says it hides.
	 */
	useLayoutEffect( () => {
		if ( collapsedContent !== null || isExpanded || ! contentElement ) {
			return;
		}
		// The element holds the full content on the render that lands here.
		setCollapsedContent( truncateToFit( contentElement ) ?? false );
	}, [ collapsedContent, isExpanded, contentElement ] );

	/*
	 * The cut depends on how the text wraps, so a narrower or wider sidebar
	 * has to be measured again. Height changes are ignored, since truncating
	 * changes the height itself.
	 */
	const measuredWidthRef = useRef( null );
	const observeWidth = useResizeObserver( ( entries ) => {
		const width = entries[ 0 ]?.contentRect.width;
		if (
			measuredWidthRef.current !== null &&
			width !== measuredWidthRef.current
		) {
			setCollapsedContent( null );
		}
		measuredWidthRef.current = width;
	} );
	const setContentRef = useCallback(
		( node ) => {
			contentRef.current = node;
			setContentElement( node );
			observeWidth( node );
		},
		[ observeWidth ]
	);

	/*
	 * The toggle sits below the text it reveals, so expanding from the button
	 * would leave a screen reader reading backwards to reach the start of the
	 * note. Move the reading position to the content instead.
	 */
	const shouldFocusContentRef = useRef( false );
	useLayoutEffect( () => {
		if ( isExpanded && shouldFocusContentRef.current ) {
			shouldFocusContentRef.current = false;
			contentElement?.focus();
		}
	}, [ isExpanded, contentElement ] );

	/*
	 * Whatever the truncation left behind is still clamped, and text can
	 * reflow past the clamp afterwards, when a web font swaps in for example.
	 * Reset the offset a browser may have scrolled to reach that text, so a
	 * re-collapsed note opens on its first lines rather than a middle slice.
	 */
	useLayoutEffect( () => {
		if ( ! isExpanded && contentRef.current ) {
			contentRef.current.scrollTop = 0;
		}
	}, [ isExpanded, collapsedContent, contentElement ] );

	const canResolve = note.parent === 0;
	const isResolutionNote =
		note.type === 'note' &&
		note.meta &&
		( note.meta._wp_note_status === 'resolved' ||
			note.meta._wp_note_status === 'reopen' );

	const menuItems = [
		{
			id: 'edit',
			title: __( 'Edit' ),
			isEligible: ( { status } ) => status !== 'approved',
			onClick: () => setActionState( 'edit' ),
		},
		{
			id: 'reopen',
			title: _x( 'Reopen', 'Reopen note' ),
			isEligible: ( { status } ) => status === 'approved',
			onClick: () => onEditNote( { id: note.id, status: 'hold' } ),
		},
		{
			id: 'delete',
			title: __( 'Delete' ),
			isEligible: () => true,
			onClick: () => setActionState( 'delete' ),
		},
	];
	const availableItems =
		parentNote?.status !== 'approved'
			? menuItems.filter( ( item ) => item.isEligible( note ) )
			: [];

	const deleteConfirmMessage =
		note.parent === 0
			? __(
					"Are you sure you want to delete this note? This will also delete all of this note's replies."
			  )
			: __( 'Are you sure you want to delete this reply?' );

	const handleCancel = () => {
		setActionState( null );
		actionButtonRef.current?.focus();
	};

	let body;
	if ( actionState === 'edit' ) {
		body = (
			<NoteForm
				onSubmit={ async ( value ) => {
					const saved = await onEditNote( {
						id: note.id,
						content: value,
					} );
					// Keep the form open on failure so the edit isn't lost.
					if ( saved ) {
						handleCancel();
					}
					return saved;
				} }
				onCancel={ handleCancel }
				note={ note }
				labels={ {
					submit: _x( 'Update', 'verb' ),
					input: sprintf(
						// translators: %1$s: note identifier, %2$s: author name.
						__( 'Edit note %1$s by %2$s' ),
						note.id,
						note.author_name
					),
				} }
			/>
		);
	} else {
		let content;
		if ( isResolutionNote ) {
			const actionText =
				note.meta._wp_note_status === 'resolved'
					? __( 'Marked as resolved' )
					: __( 'Reopened' );
			const raw = note?.content?.raw;
			content =
				raw && typeof raw === 'string' && raw.trim() !== ''
					? sprintf(
							// translators: %1$s: action label ("Marked as resolved" or "Reopened"); %2$s: note text.
							__( '%1$s: %2$s' ),
							actionText,
							raw
					  )
					: actionText;
		} else {
			content = note?.content?.rendered;
		}

		const collapsed = ! isExpanded && isOverflowing;
		body = (
			<div
				ref={ setContentRef }
				id={ contentId }
				// Not a tab stop; a target for the toggle to move focus to.
				tabIndex={ -1 }
				className={ clsx( 'editor-collab-sidebar-panel__note-content', {
					'editor-collab-sidebar-panel__resolution-text':
						isResolutionNote,
					'is-collapsed': ! isExpanded,
				} ) }
				/*
				 * Truncation is measured once, so text can still reflow past
				 * the clamp afterwards. Expand if focus reaches something left
				 * below it, rather than leaving focus out of sight.
				 */
				onFocusCapture={ ( event ) => {
					if (
						contentElement &&
						event.target !== contentElement &&
						event.target.getBoundingClientRect().bottom >
							contentElement.getBoundingClientRect().bottom
					) {
						setIsExpanded( true );
					}
				} }
				dangerouslySetInnerHTML={ {
					__html: ( collapsed ? collapsedContent : content ) ?? '',
				} }
			/>
		);
	}

	const actions = isSelected ? (
		<>
			{ canResolve && onResolve && (
				<Button
					label={ _x( 'Resolve', 'Mark note as resolved' ) }
					size="small"
					icon={ published }
					disabled={ note.status === 'approved' }
					accessibleWhenDisabled={ note.status === 'approved' }
					onClick={ onResolve }
				/>
			) }
			<NoteActionsMenu
				items={ availableItems }
				buttonRef={ actionButtonRef }
			/>
		</>
	) : null;

	return (
		<NoteCard
			note={ note }
			actions={ actions }
			role={ note.parent !== 0 ? 'treeitem' : undefined }
		>
			{ body }
			{ actionState === 'delete' && (
				<ConfirmDialog
					isOpen
					onConfirm={ () => {
						onDeleteNote( note );
						setActionState( null );
					} }
					onCancel={ handleCancel }
					confirmButtonText={ __( 'Delete' ) }
				>
					{ deleteConfirmMessage }
				</ConfirmDialog>
			) }
			{ isOverflowing && 'edit' !== actionState && (
				<UIButton
					className="editor-collab-sidebar-panel__show-more-button"
					variant="unstyled"
					size="small"
					aria-expanded={ isExpanded }
					aria-controls={ contentId }
					onClick={ () => {
						shouldFocusContentRef.current = ! isExpanded;
						setIsExpanded( ! isExpanded );
					} }
				>
					{ ! isExpanded ? __( 'Show more' ) : __( 'Show less' ) }
				</UIButton>
			) }
		</NoteCard>
	);
}
