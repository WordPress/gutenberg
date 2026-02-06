/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Popover,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { humanTimeDiff } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { REACTION_EMOJIS } from './reaction-emoji-picker';

/**
 * Get user display name by ID.
 *
 * @param {Object} users  Map of user data by ID.
 * @param {number} userId The user ID.
 * @return {string} The user's display name or a fallback.
 */
function getUserName( users, userId ) {
	return users?.[ userId ]?.name || __( 'Unknown user' );
}

/**
 * Get user avatar URL by ID.
 *
 * @param {Object} users  Map of user data by ID.
 * @param {number} userId The user ID.
 * @return {string|null} The user's avatar URL or null.
 */
function getUserAvatar( users, userId ) {
	return users?.[ userId ]?.avatar_urls?.[ 48 ] || null;
}

/**
 * A popover showing who reacted and when.
 *
 * @param {Object}   props           Component props.
 * @param {Object}   props.reactions The reactions object from comment meta.
 * @param {Function} props.onClose   Callback to close the popover.
 * @param {Object}   props.anchor    The anchor element for the popover.
 */
export default function ReactionDetailsPopover( {
	reactions,
	onClose,
	anchor,
} ) {
	// Collect all unique user IDs from reactions using useMemo for stable reference.
	const userIdArray = useMemo( () => {
		if ( ! reactions ) {
			return [];
		}
		const userIdSet = new Set();
		Object.values( reactions ).forEach( ( reactionList ) => {
			reactionList?.forEach( ( reaction ) => {
				if ( reaction.userId ) {
					userIdSet.add( reaction.userId );
				}
			} );
		} );
		return Array.from( userIdSet ).sort( ( a, b ) => a - b );
	}, [ reactions ] );

	// Fetch user data for all users who reacted in a single request.
	const users = useSelect(
		( select ) => {
			if ( ! userIdArray.length ) {
				return {};
			}
			const { getUsers } = select( coreStore );
			const userList = getUsers( {
				include: userIdArray,
				context: 'view',
				_fields: 'id,name,avatar_urls',
				per_page: -1,
			} );
			if ( ! userList ) {
				return {};
			}
			const userData = {};
			userList.forEach( ( user ) => {
				userData[ user.id ] = user;
			} );
			return userData;
		},
		[ userIdArray ]
	);

	if ( ! reactions ) {
		return null;
	}

	// Get emojis that have reactions, in the order they appear in REACTION_EMOJIS.
	const orderedEmojis = REACTION_EMOJIS.map( ( { emoji } ) => emoji ).filter(
		( emoji ) => reactions[ emoji ]?.length > 0
	);

	return (
		<Popover
			placement="bottom-start"
			onClose={ onClose }
			anchor={ anchor }
			className="editor-collab-sidebar-panel__reaction-details"
		>
			<VStack
				spacing="3"
				className="editor-collab-sidebar-panel__reaction-details-content"
			>
				{ orderedEmojis.map( ( emoji ) => {
					const emojiData = REACTION_EMOJIS.find(
						( e ) => e.emoji === emoji
					);
					const reactionList = reactions[ emoji ];

					return (
						<VStack key={ emoji } spacing="2">
							<HStack spacing="2" alignment="left">
								<span className="editor-collab-sidebar-panel__reaction-details-emoji">
									{ emoji }
								</span>
								<Text weight={ 600 }>{ emojiData?.label }</Text>
							</HStack>
							<VStack spacing="1">
								{ reactionList.map( ( reaction, index ) => (
									<HStack
										key={ `${ reaction.userId }-${ index }` }
										spacing="3"
										alignment="left"
										className="editor-collab-sidebar-panel__reaction-details-user"
									>
										{ getUserAvatar(
											users,
											reaction.userId
										) && (
											<img
												src={ getUserAvatar(
													users,
													reaction.userId
												) }
												alt=""
												className="editor-collab-sidebar-panel__reaction-details-avatar"
											/>
										) }
										<Text>
											{ getUserName(
												users,
												reaction.userId
											) }
										</Text>
										<Text variant="muted">
											{ humanTimeDiff(
												reaction.timestamp
											) }
										</Text>
									</HStack>
								) ) }
							</VStack>
						</VStack>
					);
				} ) }
			</VStack>
		</Popover>
	);
}
