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
import PluginSidebarMoreMenuItem from '../plugin-sidebar-more-menu-item';
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
	if (
		! isBlockCommentExperimentEnabled ||
		Object.keys( threads ).length === 0
	) {
		return null; // or maybe return some message indicating no threads are available.
	}

	// Get the date time format from WordPress settings.
	const dateTimeFormat = getSettings().formats.datetime;

	return (
		<>
			<PluginSidebarMoreMenuItem
				target="collab-activities"
				icon={ commentIcon }
			>
				{ __( 'Collab' ) }
			</PluginSidebarMoreMenuItem>
			<PluginSidebar
				name="collab-activities"
				title={ __( 'Collab Activities' ) }
			>
				<div className="editor-collab-sidebar__activities">
					{ Object.values( threads )
						.reverse()
						.map( ( thread, index ) => (
							<VStack
								key={ index }
								className="editor-collab-sidebar__thread"
							>
								<HStack
									alignment="left"
									spacing="1"
									justify="flex-start"
								>
									<Icon icon={ userIcon } size={ 35 } />
									<VStack spacing="1">
										<span>{ thread.createdBy }</span>
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
											spacing="1"
											justify="flex-start"
										>
											<Icon
												icon={ userIcon }
												size={ 35 }
											/>
											<VStack spacing="1">
												<span>
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
											spacing="1"
											justify="flex-start"
										>
											<Icon
												icon={ userIcon }
												size={ 35 }
											/>
											<VStack spacing="1">
												<span>
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
											/>
											<Text>
												{ __( 'Marked as resolved' ) }
											</Text>
										</HStack>
									</VStack>
								) }
							</VStack>
						) ) }
				</div>
			</PluginSidebar>
		</>
	);
}
