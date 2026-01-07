/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	__experimentalText as Text,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef, useMemo } from '@wordpress/element';
import {
	Icon,
	lockSmall as lock,
	pinSmall,
	unseen,
	symbol,
} from '@wordpress/icons';
import { SPACE, ENTER } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { hasBlockSupport } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import ListViewExpander from './expander';
import { useBlockLock } from '../block-lock';
import useListViewImages from './use-list-view-images';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );

function ListViewBlockSelectButton(
	{
		className,
		block: { clientId },
		notes,
		onClick,
		onContextMenu,
		onMouseDown,
		onToggleExpanded,
		tabIndex,
		onFocus,
		onDragStart,
		onDragEnd,
		draggable,
		isExpanded,
		ariaDescribedBy,
	},
	ref
) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const { isLocked } = useBlockLock( clientId );
	const { canToggleBlockVisibility, isBlockHidden, hasPatternName } =
		useSelect(
			( select ) => {
				const { getBlockName, getBlockAttributes } =
					select( blockEditorStore );
				const { isBlockHidden: _isBlockHidden } = unlock(
					select( blockEditorStore )
				);
				const blockAttributes = getBlockAttributes( clientId );
				return {
					canToggleBlockVisibility: hasBlockSupport(
						getBlockName( clientId ),
						'visibility',
						true
					),
					isBlockHidden: _isBlockHidden( clientId ),
					hasPatternName: !! blockAttributes?.metadata?.patternName,
				};
			},
			[ clientId ]
		);
	const shouldShowLockIcon = isLocked;
	const shouldShowBlockVisibilityIcon =
		canToggleBlockVisibility && isBlockHidden;
	const isSticky = blockInformation?.positionType === 'sticky';
	const images = useListViewImages( { clientId, isExpanded } );

	// The `href` attribute triggers the browser's native HTML drag operations.
	// When the link is dragged, the element's outerHTML is set in DataTransfer object as text/html.
	// We need to clear any HTML drag data to prevent `pasteHandler` from firing
	// inside the `useOnBlockDrop` hook.
	const onDragStartHandler = ( event ) => {
		event.dataTransfer.clearData();
		onDragStart?.( event );
	};

	/**
	 * @param {KeyboardEvent} event
	 */
	function onKeyDown( event ) {
		if ( event.keyCode === ENTER || event.keyCode === SPACE ) {
			onClick( event );
		}
	}

	const threadParticipants = useMemo( () => {
		if ( ! notes ) {
			return [];
		}

		const participantsMap = new Map();
		const allComments = [ notes, ...notes.reply ];

		// Sort by date to show participants in chronological order.
		allComments.sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) );

		allComments.forEach( ( comment ) => {
			// Track thread participants (original commenter + repliers).
			if ( comment.author_name && comment.author_avatar_urls ) {
				if ( ! participantsMap.has( comment.author ) ) {
					participantsMap.set( comment.author, {
						name: comment.author_name,
						avatar:
							comment.author_avatar_urls?.[ '48' ] ||
							comment.author_avatar_urls?.[ '96' ],
						id: comment.author,
						date: comment.date,
					} );
				}
			}
		} );

		return Array.from( participantsMap.values() );
	}, [ notes ] );

	const maxAvatars = 3;
	const isOverflow = threadParticipants?.length > maxAvatars;
	const visibleParticipants = isOverflow
		? threadParticipants?.slice( 0, maxAvatars - 1 )
		: threadParticipants;
	const overflowCount = Math.max(
		0,
		threadParticipants?.length - visibleParticipants?.length
	);
	const threadHasMoreParticipants = threadParticipants?.length > 100;

	const overflowText =
		threadHasMoreParticipants && overflowCount > 0
			? __( '100+' )
			: sprintf(
					// translators: %s: Number of participants.
					__( '+%s' ),
					overflowCount
			  );

	return (
		<a
			className={ clsx(
				'block-editor-list-view-block-select-button',
				className
			) }
			onClick={ onClick }
			onContextMenu={ onContextMenu }
			onKeyDown={ onKeyDown }
			onMouseDown={ onMouseDown }
			ref={ ref }
			tabIndex={ tabIndex }
			onFocus={ onFocus }
			onDragStart={ onDragStartHandler }
			onDragEnd={ onDragEnd }
			draggable={ draggable }
			href={ `#block-${ clientId }` }
			aria-describedby={ ariaDescribedBy }
			aria-expanded={ isExpanded }
		>
			<ListViewExpander onClick={ onToggleExpanded } />
			<BlockIcon
				icon={ hasPatternName ? symbol : blockInformation?.icon }
				showColors
				context="list-view"
			/>
			<HStack
				alignment="center"
				className="block-editor-list-view-block-select-button__label-wrapper"
				justify="flex-start"
				spacing={ 1 }
			>
				<span className="block-editor-list-view-block-select-button__title">
					<Truncate ellipsizeMode="auto">{ blockTitle }</Truncate>
				</span>
				{ blockInformation?.anchor && (
					<span className="block-editor-list-view-block-select-button__anchor-wrapper">
						<Badge className="block-editor-list-view-block-select-button__anchor">
							{ blockInformation.anchor }
						</Badge>
					</span>
				) }
				{ isSticky && (
					<span className="block-editor-list-view-block-select-button__sticky">
						<Icon icon={ pinSmall } />
					</span>
				) }
				{ images.length ? (
					<span
						className="block-editor-list-view-block-select-button__images"
						aria-hidden
					>
						{ images.map( ( image, index ) => (
							<span
								className="block-editor-list-view-block-select-button__image"
								key={ image.clientId }
								style={ {
									backgroundImage: `url(${ image.url })`,
									zIndex: images.length - index, // Ensure the first image is on top, and subsequent images are behind.
								} }
							/>
						) ) }
					</span>
				) : null }
				{ shouldShowBlockVisibilityIcon && (
					<span className="block-editor-list-view-block-select-button__block-visibility">
						<Icon icon={ unseen } />
					</span>
				) }
				{ shouldShowLockIcon && (
					<span className="block-editor-list-view-block-select-button__lock">
						<Icon icon={ lock } />
					</span>
				) }
			</HStack>
			{ notes && (
				<div className="block-editor-list-view-block-comment-avatar-indicator comment-avatar-indicator">
					<HStack spacing="0.5">
						{ visibleParticipants.map( ( participant ) => (
							<img
								key={ participant.id }
								src={ participant.avatar }
								alt={ participant.author_name }
								className="comment-avatar"
							/>
						) ) }
						{ overflowCount > 0 && (
							<Text weight={ 500 }>{ overflowText }</Text>
						) }
					</HStack>
				</div>
			) }
		</a>
	);
}

export default forwardRef( ListViewBlockSelectButton );
