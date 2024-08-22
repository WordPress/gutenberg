/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { comment as commentIcon } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, RawHTML } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	Button,
} from '@wordpress/components';
import { dateI18n, format, getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';

const isBlockCommentExperimentEnabled =
	window?.__experimentalEnableBlockComment;

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const postId = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/editor' ).getCurrentPostId();
	}, [] );

	const [ threads, setThreads ] = useState( [] );
	const [ showConfirmation, setShowConfirmation ] = useState( false );
	const [ showConfirmationTabId, setShowConfirmationTabId ] = useState( 0 );
	const [ commentConfirmation, setCommentConfirmation ] = useState( false );

	useEffect( () => {
		if ( postId ) {
			apiFetch( {
				path:
					'/wp/v2/comments?post=' +
					postId +
					'&type=block_comment' +
					'&status=any',
				method: 'GET',
			} ).then( ( response ) => {
				setThreads( Array.isArray( response ) ? response : [] );
			} );
		}
	}, [ postId ] );

	const { threads: selectedThreads } = useSelect( () => {
		return {
			threads,
		};
	}, [ threads ] );

	// Check if the experimental flag is enabled.
	if ( ! isBlockCommentExperimentEnabled ) {
		return null; // or maybe return some message indicating no threads are available.
	}

	const confirmAndMarkThreadAsResolved = ( threadID ) => {
		setCommentConfirmation( false );
		if ( threadID ) {
			apiFetch( {
				path: '/wp/v2/comments/' + threadID,
				method: 'POST',
				data: {
					status: 'approved',
				},
			} ).then( ( response ) => {
				if ( 'approved' === response.status ) {
					setShowConfirmation( false );
					setCommentConfirmation( true );
				}
			} );
		}
	};

	// Get the date time format from WordPress settings.
	const dateTimeFormat = getSettings().formats.datetime;
	const resultThreads = selectedThreads.map( ( thread ) => thread ).reverse();

	return (
		<PluginSidebar
			name="collab-activities"
			title={ __( 'Comments' ) }
			icon={ commentIcon }
		>
			<div className="editor-collab-sidebar__activities">
				{
					// If there are no threads, show a message indicating no threads are available.
					( ! Array.isArray( resultThreads ) ||
						resultThreads.length === 0 ) && (
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
				{ Array.isArray( resultThreads ) &&
					resultThreads.length > 0 &&
					resultThreads.reverse().map( ( thread ) => (
						<VStack
							key={ thread.id }
							className="editor-collab-sidebar__thread"
							id={ thread.id }
							spacing="2"
						>
							<HStack
								alignment="left"
								spacing="3"
								justify="flex-start"
							>
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
										dateTime={ format(
											'c',
											thread.createdAt
										) }
										className="editor-collab-sidebar__usertime"
									>
										{ dateI18n(
											dateTimeFormat,
											thread.createdAt
										) }
									</time>
								</VStack>
							</HStack>
							<HStack
								alignment="left"
								spacing="3"
								justify="flex-start"
								className="editor-collab-sidebar__usercomment"
							>
								<VStack spacing="1">
									<RawHTML>
										{ thread.content.rendered }
									</RawHTML>
								</VStack>
							</HStack>
							<HStack
								alignment="left"
								spacing="3"
								className="editor-collab-sidebar__userstatus"
							>
								{ thread.status !== 'approved' && (
									<Button
										className="is-tertiary"
										onClick={ () => {
											setCommentConfirmation( false );
											setShowConfirmation( true );
											setShowConfirmationTabId(
												thread.id
											);
										} }
									>
										{ __( 'Resolve' ) }
									</Button>
								) }
								{ thread.status === 'approved' && (
									// eslint-disable-next-line no-restricted-syntax
									<Button
										disabled="true"
										__experimentalIsFocusable={ false }
										className="is-tertiary"
									>
										{ __( 'Resolved' ) }
									</Button>
								) }
								<Button className="is-tertiary">
									{ __( 'Reply' ) }
								</Button>
							</HStack>

							{ commentConfirmation &&
								thread.id === showConfirmationTabId && (
									<Text>
										{ __( 'Thread marked as resolved.' ) }
									</Text>
								) }

							{ showConfirmation &&
								thread.id === showConfirmationTabId && (
									<VStack
										title={ __( 'Confirm' ) }
										onRequestClose={ () =>
											setShowConfirmation( false )
										}
										className="editor-collab-sidebar__useroverlay confirmation-overlay"
										spacing="3"
									>
										<p>
											{ __(
												'Are you sure you want to mark this thread as resolved?'
											) }
										</p>
										<HStack>
											<Button
												variant="primary"
												onClick={ () =>
													confirmAndMarkThreadAsResolved(
														thread.id
													)
												}
											>
												{ __( 'Yes' ) }
											</Button>
											<Button
												onClick={ () =>
													setShowConfirmation( false )
												}
											>
												{ __( 'No' ) }
											</Button>
										</HStack>
									</VStack>
								) }
						</VStack>
					) ) }
			</div>
		</PluginSidebar>
	);
}
