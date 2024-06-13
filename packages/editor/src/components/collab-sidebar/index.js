/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	comment as commentIcon,
	commentAuthorAvatar as userIcon,
	Icon,
	check as resolvedIcon,
} from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { dateI18n, format, getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { store as editorStore } from '../../store';

const isBlockCommentExperimentEnabled =
	window?.__experimentalEnableBlockComment;

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const { threads } = useSelect( ( select ) => {
		const post = select( editorStore ).getCurrentPost();

		return {
			threads: post?.meta?.collab ? JSON.parse( post.meta.collab ) : [],
		};
	}, [] );

	// Check if the experimental flag is enabled and thread count is greater than zero.
	if ( ! isBlockCommentExperimentEnabled ) {
		return null; // or maybe return some message indicating no threads are available.
	}

	// Get the date time format from WordPress settings.
	const dateTimeFormat = getSettings().formats.datetime;

	return (
		<PluginSidebar
			name="collab-activities"
			title={ __( 'Collab Activities' ) }
			icon={ commentIcon }
		>
			<div className="editor-collab-sidebar__activities">
				{
					// If there are no threads, show a message indicating no threads are available.
					Object.keys( threads ).length === 0 && (
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
				{ Object.keys( threads ).length > 0 &&
					Object.values( threads )
						.reverse()
						.map( ( thread, index ) => (
							<VStack
								key={ index }
								className="editor-collab-sidebar__thread"
								spacing="3"
							>
								<HStack
									alignment="left"
									spacing="3"
									justify="flex-start"
								>
									<Icon
										icon={ userIcon }
										className="editor-collab-sidebar__userIcon"
										size={ 35 }
									/>
									<VStack spacing="1">
										<span className="editor-collab-sidebar__userName">
											{ thread.createdBy }
										</span>
										<time
											dateTime={ format(
												'c',
												thread.createdAt
											) }
										>
											{ dateI18n(
												dateTimeFormat,
												thread.createdAt
											) }
										</time>
									</VStack>
								</HStack>
								{ thread.comments.map( ( comment ) => (
									<VStack
										key={ comment.commentId }
										className="editor-collab-sidebar__comment"
									>
										<HStack
											alignment="center"
											spacing="3"
											justify="flex-start"
										>
											<Icon
												icon={ userIcon }
												className="editor-collab-sidebar__userIcon"
												size={ 35 }
											/>
											<VStack spacing="1">
												<span className="editor-collab-sidebar__userName">
													{ comment.createdBy }
												</span>
												<time
													dateTime={ format(
														'c',
														comment.createdAt
													) }
												>
													{ dateI18n(
														dateTimeFormat,
														comment.createdAt
													) }
												</time>
											</VStack>
										</HStack>
										<HStack
											alignment="center"
											spacing="1"
											justify="flex-start"
										>
											{ comment.comment }
										</HStack>
									</VStack>
								) ) }
								{ thread.isResolved && (
									<VStack className="editor-collab-sidebar__resolved">
										<HStack
											alignment="center"
											spacing="3"
											justify="flex-start"
										>
											<Icon
												icon={ userIcon }
												className="editor-collab-sidebar__userIcon"
												size={ 35 }
											/>
											<VStack spacing="1">
												<span className="editor-collab-sidebar__userName">
													{ thread.resolvedBy }
												</span>
												<time
													dateTime={ format(
														'c',
														thread.resolvedAt
													) }
												>
													{ dateI18n(
														dateTimeFormat,
														thread.resolvedAt
													) }
												</time>
											</VStack>
										</HStack>
										<HStack
											alignment="center"
											spacing="1"
											justify="flex-start"
										>
											<Icon
												icon={ resolvedIcon }
												size={ 20 }
												className="editor-collab-sidebar__resolvedIcon"
											/>
											<Text className="editor-collab-sidebar__resolvedText">
												{ __( 'Marked as resolved' ) }
											</Text>
										</HStack>
									</VStack>
								) }
							</VStack>
						) ) }
			</div>
		</PluginSidebar>
	);
}
