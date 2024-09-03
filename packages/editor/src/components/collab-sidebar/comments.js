/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useMemo, RawHTML } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	DropdownMenu,
	TextareaControl,
	Tooltip,
} from '@wordpress/components';
import {
	dateI18n,
	format,
	getSettings as getDateSettings,
} from '@wordpress/date';
import { Icon, check, published, moreVertical } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { sanitizeCommentString } from './utils';

/**
 * Renders the Comments component.
 *
 * @param {Object}   props                  - The component props.
 * @param {Array}    props.threads          - The array of comment threads.
 * @param {Function} props.onEditComment    - The function to handle comment editing.
 * @param {Function} props.onAddReply       - The function to add a reply to a comment.
 * @param {Function} props.onCommentDelete  - The function to delete a comment.
 * @param {Function} props.onCommentResolve - The function to mark a comment as resolved.
 * @return {JSX.Element} The rendered Comments component.
 */
export function Comments( {
	threads,
	onEditComment,
	onAddReply,
	onCommentDelete,
	onCommentResolve,
} ) {
	const [ actionState, setActionState ] = useState( false );

	const blockCommentId = useSelect( ( select ) => {
		const clientID = select( blockEditorStore ).getSelectedBlockClientId();
		return (
			select( blockEditorStore ).getBlock( clientID )?.attributes
				?.blockCommentId ?? false
		);
	}, [] );

	return (
		<>
			{
				// If there are no threads, show a message indicating no threads are available.
				( ! Array.isArray( threads ) || threads.length === 0 ) && (
					<VStack
						alignment="left"
						className="editor-collab-sidebar__thread"
						justify="flex-start"
						spacing="3"
					>
						{ __( 'No comments available' ) }
					</VStack>
				)
			}

			{ Array.isArray( threads ) &&
				threads.length > 0 &&
				threads.map( ( thread ) => (
					<VStack
						key={ thread.id }
						className={ clsx( 'editor-collab-sidebar__thread', {
							'editor-collab-sidebar__activethread':
								blockCommentId && blockCommentId === thread.id,
						} ) }
						id={ thread.id }
						spacing="2"
					>
						<CommentHeader
							thread={ thread }
							onResolve={ () => {
								setActionState( {
									action: 'resolve',
									id: thread.id,
								} );
							} }
							onEdit={ () => {
								setActionState( {
									action: 'edit',
									id: thread.id,
								} );
							} }
							onDelete={ () => {
								setActionState( {
									action: 'delete',
									id: thread.id,
								} );
							} }
							onReply={ () => {
								setActionState( {
									action: 'reply',
									id: thread.id,
								} );
							} }
							status={ thread.status }
						/>
						<HStack
							alignment="left"
							spacing="3"
							justify="flex-start"
							className="editor-collab-sidebar__usercomment"
						>
							<VStack
								spacing="3"
								className="editor-collab-sidebar__editarea"
							>
								{ 'edit' === actionState?.action &&
									thread.id === actionState?.id && (
										<EditComment
											thread={ thread }
											onUpdate={ ( inputComment ) => {
												onEditComment(
													thread.id,
													inputComment
												);
												setActionState( false );
											} }
											onCancel={ () => {
												setActionState( false );
											} }
										/>
									) }
								{ ( ! actionState ||
									'edit' !== actionState?.action ) && (
									<RawHTML>
										{ thread.content.rendered }
									</RawHTML>
								) }
							</VStack>
						</HStack>

						{ 'reply' === actionState?.action &&
							thread.id === actionState?.id && (
								<AddReply
									onSubmit={ ( inputComment ) => {
										onAddReply( thread.id, inputComment );
										setActionState( false );
									} }
									onCancel={ () => {
										setActionState( false );
									} }
								/>
							) }
						{ 'resolve' === actionState?.action &&
							thread.id === actionState?.id && (
								<ConfirmNotice
									confirmMessage={ __(
										'Are you sure you want to mark this thread as resolved?'
									) }
									confirmAction={ () => {
										onCommentResolve( thread.id );
										setActionState( false );
									} }
									discardAction={ () =>
										setActionState( false )
									}
								/>
							) }
						{ 'delete' === actionState?.action &&
							thread.id === actionState?.id && (
								<ConfirmNotice
									confirmMessage={ __(
										'Are you sure you want to delete this thread?'
									) }
									confirmAction={ () => {
										onCommentDelete( thread.id );
										setActionState( false );
									} }
									discardAction={ () =>
										setActionState( false )
									}
								/>
							) }
						{ 0 < thread?.reply?.length &&
							thread.reply.map( ( reply ) => (
								<VStack
									key={ reply.id }
									className="editor-collab-sidebar__childThread"
									id={ reply.id }
									spacing="2"
								>
									<CommentHeader
										thread={ reply }
										onResolve={ () => {
											setActionState( {
												action: 'resolve',
												id: thread.id,
											} );
										} }
										onEdit={ () => {
											setActionState( {
												action: 'edit',
												id: reply.id,
											} );
										} }
										onDelete={ () => {
											setActionState( {
												action: 'delete',
												id: reply.id,
											} );
										} }
										status={ thread.status }
									/>
									<HStack
										alignment="left"
										spacing="3"
										justify="flex-start"
										className="editor-collab-sidebar__usercomment"
									>
										<VStack
											spacing="3"
											className="editor-collab-sidebar__editarea"
										>
											{ 'edit' === actionState?.action &&
												reply.id ===
													actionState?.id && (
													<EditComment
														thread={ reply }
														onUpdate={ (
															inputComment
														) => {
															onEditComment(
																reply.id,
																inputComment
															);
															setActionState(
																false
															);
														} }
														onCancel={ () => {
															setActionState(
																false
															);
														} }
													/>
												) }
											{ ( ! actionState ||
												'edit' !==
													actionState?.action ) && (
												<RawHTML>
													{ reply.content.rendered }
												</RawHTML>
											) }
										</VStack>
									</HStack>
									{ 'delete' === actionState?.action &&
										reply.id === actionState?.id && (
											<ConfirmNotice
												confirmMessage={ __(
													'Are you sure you want to delete this thread?'
												) }
												confirmAction={ () => {
													onCommentDelete( reply.id );
													setActionState( false );
												} }
												discardAction={ () =>
													setActionState( false )
												}
											/>
										) }
								</VStack>
							) ) }
					</VStack>
				) ) }
		</>
	);
}

/**
 * EditComment component.
 *
 * @param {Object}   props          - The component props.
 * @param {Object}   props.thread   - The comment thread object.
 * @param {Function} props.onUpdate - The function to call when updating the comment.
 * @param {Function} props.onCancel - The function to call when canceling the comment update.
 * @return {JSX.Element} The EditComment component.
 */
function EditComment( { thread, onUpdate, onCancel } ) {
	const [ inputComment, setInputComment ] = useState(
		thread.content.rendered.replace( /<[^>]+>/g, '' )
	);

	return (
		<>
			<TextareaControl
				__nextHasNoMarginBottom
				className="editor-collab-sidebar__replyComment__textarea"
				value={ inputComment ?? '' }
				onChange={ ( value ) => {
					setInputComment( value );
				} }
			/>
			<VStack
				alignment="left"
				spacing="3"
				justify="flex-start"
				className="editor-collab-sidebar__commentbtn"
			>
				<HStack alignment="left" spacing="3" justify="flex-start">
					<Button
						__next40pxDefaultSize
						accessibleWhenDisabled
						variant="primary"
						onClick={ () => onUpdate( inputComment ) }
						size="compact"
						disabled={
							0 === sanitizeCommentString( inputComment ).length
						}
					>
						{ __( 'Update' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						onClick={ onCancel }
						size="compact"
					>
						{ __( 'Cancel' ) }
					</Button>
				</HStack>
			</VStack>
		</>
	);
}

/**
 * Renders a component to add a reply.
 *
 * @param {Object}   props          - The component props.
 * @param {Function} props.onSubmit - The function to be called when the reply is submitted.
 * @param {Function} props.onCancel - The function to be called when the reply is canceled.
 * @return {JSX.Element} The JSX element representing the AddReply component.
 */
function AddReply( { onSubmit, onCancel } ) {
	const [ inputComment, setInputComment ] = useState( '' );

	return (
		<HStack alignment="left" spacing="3" justify="flex-start">
			<VStack
				alignment="left"
				spacing="3"
				className="editor-collab-sidebar__replyComment"
			>
				<TextareaControl
					__nextHasNoMarginBottom
					className="editor-collab-sidebar__replyComment__textarea"
					value={ inputComment ?? '' }
					onChange={ ( value ) => {
						setInputComment( value );
					} }
				/>
				<VStack alignment="left" spacing="3" justify="flex-start">
					<HStack
						alignment="left"
						spacing="3"
						justify="flex-start"
						className="editor-collab-sidebar__replybtn"
					>
						<Button
							__next40pxDefaultSize
							accessibleWhenDisabled
							variant="primary"
							onClick={ () => onSubmit( inputComment ) }
							size="compact"
							disabled={
								0 ===
								sanitizeCommentString( inputComment ).length
							}
						>
							{ __( 'Reply' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							onClick={ onCancel }
							size="compact"
						>
							{ __( 'Cancel' ) }
						</Button>
					</HStack>
				</VStack>
			</VStack>
		</HStack>
	);
}

/**
 * Renders a confirmation notice component.
 *
 * @param {Object}   props               - The component props.
 * @param {string}   props.cofirmMessage - The confirmation message to display. Defaults to 'Are you sure?' if not provided.
 * @param {Function} props.confirmAction - The action to perform when the confirm button is clicked.
 * @param {Function} props.discardAction - The action to perform when the discard button is clicked.
 * @return {JSX.Element} The confirmation notice component.
 */
function ConfirmNotice( { cofirmMessage, confirmAction, discardAction } ) {
	return (
		<VStack
			title={ __( 'Confirm' ) }
			className="editor-collab-sidebar__useroverlay confirmation-overlay"
			spacing="0"
			justify="space-between"
		>
			<p>{ cofirmMessage ?? __( 'Are you sure?' ) }</p>
			<HStack>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ confirmAction }
					size="compact"
				>
					{ __( 'Yes' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					onClick={ discardAction }
					size="compact"
				>
					{ __( 'No' ) }
				</Button>
			</HStack>
		</VStack>
	);
}

/**
 * Renders the header of a comment in the collaboration sidebar.
 *
 * @param {Object}   props           - The component props.
 * @param {Object}   props.thread    - The comment thread object.
 * @param {Function} props.onResolve - The function to resolve the comment.
 * @param {Function} props.onEdit    - The function to edit the comment.
 * @param {Function} props.onDelete  - The function to delete the comment.
 * @param {Function} props.onReply   - The function to reply to the comment.
 * @param {string}   props.status    - The status of the comment.
 * @return {JSX.Element} The rendered comment header.
 */
function CommentHeader( {
	thread,
	onResolve,
	onEdit,
	onDelete,
	onReply,
	status,
} ) {
	const dateSettings = getDateSettings();
	const [ dateTimeFormat = dateSettings.formats.time ] = useEntityProp(
		'root',
		'site',
		'time_format'
	);

	const memorizedMoreActions = useMemo( () => {
		return [
			{
				title: __( 'Edit' ),
				onClick: onEdit,
			},
			{
				title: __( 'Delete' ),
				onClick: onDelete,
			},
			{
				title: __( 'Reply' ),
				onClick: onReply,
			},
		];
	}, [] );

	const moreActions = memorizedMoreActions.filter( ( item ) => item.onClick );

	return (
		<HStack alignment="left" spacing="3" justify="flex-start">
			<img
				src={ thread?.author_avatar_urls?.[ 48 ] }
				className="editor-collab-sidebar__userIcon"
				alt={ __( 'User avatar' ) }
				width={ 32 }
				height={ 32 }
			/>
			<VStack spacing="0">
				<span className="editor-collab-sidebar__userName">
					{ thread.author_name }
				</span>
				<time
					dateTime={ format( 'h:i A', thread.date ) }
					className="editor-collab-sidebar__usertime"
				>
					{ dateI18n( dateTimeFormat, thread.date ) }
				</time>
			</VStack>
			<span className="editor-collab-sidebar__commentUpdate">
				{ status !== 'approved' && (
					<HStack alignment="right" justify="flex-end" spacing="0">
						{ 0 === thread.parent && onResolve && (
							<Button
								label={ __( 'Resolve' ) }
								__next40pxDefaultSize
								icon={ published }
								onClick={ onResolve }
								showTooltip
							/>
						) }
						<DropdownMenu
							icon={ moreVertical }
							label="Select an action"
							className="editor-collab-sidebar__commentDropdown"
							controls={ moreActions }
						/>
					</HStack>
				) }
				{ status === 'approved' && (
					<Tooltip text={ __( 'Resolved' ) }>
						<Icon icon={ check } />
					</Tooltip>
				) }
			</span>
		</HStack>
	);
}
