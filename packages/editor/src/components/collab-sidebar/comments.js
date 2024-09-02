/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, RawHTML } from '@wordpress/element';
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
						className="editor-collab-sidebar__thread"
						spacing="3"
					>
						<HStack
							alignment="left"
							spacing="3"
							justify="flex-start"
						>
							{ __( 'No comments available' ) }
						</HStack>
					</VStack>
				)
			}

			{ Array.isArray( threads ) &&
				threads.length > 0 &&
				threads.reverse().map( ( thread ) => (
					<VStack
						key={ thread.id }
						className={ clsx( 'editor-collab-sidebar__thread', {
							'is-focused':
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
						variant="primary"
						onClick={ () => onUpdate( inputComment ) }
					>
						{ __( 'Update' ) }
					</Button>
					<Button __next40pxDefaultSize onClick={ onCancel }>
						{ __( 'Cancel' ) }
					</Button>
				</HStack>
			</VStack>
		</>
	);
}

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
							variant="primary"
							onClick={ () => onSubmit( inputComment ) }
						>
							{ __( 'Reply' ) }
						</Button>
						<Button __next40pxDefaultSize onClick={ onCancel }>
							{ __( 'Cancel' ) }
						</Button>
					</HStack>
				</VStack>
			</VStack>
		</HStack>
	);
}

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
				>
					{ __( 'Yes' ) }
				</Button>
				<Button __next40pxDefaultSize onClick={ discardAction }>
					{ __( 'No' ) }
				</Button>
			</HStack>
		</VStack>
	);
}

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

	let moreActions = [
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

	moreActions = moreActions.filter( ( item ) => item.onClick );

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
						{ onResolve && (
							<Tooltip text={ __( 'Resolve' ) }>
								<Button
									__next40pxDefaultSize
									className="has-icon"
								>
									<Icon
										icon={ published }
										onClick={ onResolve }
									/>
								</Button>
							</Tooltip>
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
						<Button __next40pxDefaultSize className="has-icon">
							<Icon icon={ check } />
						</Button>
					</Tooltip>
				) }
			</span>
		</HStack>
	);
}
