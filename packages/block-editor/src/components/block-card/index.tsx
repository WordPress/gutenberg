import clsx from 'clsx';
import { Button, Icon as WCIcon } from '@wordpress/components';
import { Badge, Text, Stack } from '@wordpress/ui';
import { useDispatch, useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import {
	chevronLeft,
	chevronRight,
	arrowRight,
	arrowLeft,
} from '@wordpress/icons';
import { getBlockType } from '@wordpress/blocks';
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import type { BlockCardProps, OptionalParentSelectButtonProps } from './types';

function OptionalParentSelectButton( {
	children,
	onClick,
}: OptionalParentSelectButtonProps ) {
	if ( ! onClick ) {
		return children;
	}

	return (
		<Button
			__next40pxDefaultSize
			className="block-editor-block-card__parent-select-button"
			onClick={ onClick }
		>
			{ children }
		</Button>
	);
}

/**
 * A card component that displays block information including title, icon, and description.
 * Can be used to show block metadata and navigation controls for parent blocks.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-card/README.md
 *
 * @example
 * ```jsx
 * function Example() {
 *   return (
 *     <BlockCard
 *       title="My Block"
 *       icon="smiley"
 *       description="A simple block example"
 *       name="Custom Block"
 *     />
 *   );
 * }
 * ```
 *
 * @param props                       Component props.
 * @param props.title                 The title of the block.
 * @param props.icon                  The icon of the block. This can be any of [WordPress' Dashicons](https://developer.wordpress.org/resource/dashicons/), or a custom `svg` element.
 * @param props.description           The description of the block.
 * @param props.blockType             Deprecated: Object containing block type data.
 * @param props.className             Additional classes to apply to the card.
 * @param props.name                  Custom block name to display before the title.
 * @param props.allowParentNavigation Show a back arrow to the parent block in some situations.
 * @param props.parentClientId        The parent clientId, if this card is for a parent block.
 * @param props.isChild               Whether the block card is for a child block, in which case, indent the block using an arrow.
 * @param props.clientId              Whether the block card is for a child block, in which case, indent the block using an arrow.
 * @param props.controls              Controls rendered beside the block title.
 * @param props.children              Children.
 * @return Block card component.
 */
function BlockCard( {
	title,
	icon,
	description,
	blockType,
	className,
	name,
	allowParentNavigation,
	parentClientId,
	isChild,
	children,
	clientId,
	controls,
}: BlockCardProps ) {
	if ( blockType ) {
		deprecated( '`blockType` property in `BlockCard component`', {
			since: '5.7',
			alternative: '`title, icon and description` properties',
		} );
		( { title, icon, description } = blockType );
	}

	const { parentBlockClientId, parentBlockName } = useSelect(
		( select ) => {
			if ( parentClientId || isChild || ! allowParentNavigation ) {
				return {};
			}
			const { getBlockParents, getBlockName, shouldRenderBlockListView } =
				unlock( select( blockEditorStore ) );

			// Find the top-most parent block that participates in List View.
			// Parent navigation is only allowed for a block's card.
			const parents = getBlockParents( clientId!, false );
			const foundParentId = parents.find( ( parentId: string ) =>
				shouldRenderBlockListView( parentId )
			);

			return {
				parentBlockClientId: foundParentId,
				parentBlockName: foundParentId
					? getBlockName( foundParentId )
					: null,
			};
		},
		[ clientId, allowParentNavigation, isChild, parentClientId ]
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	const TitleElement = parentClientId ? 'div' : 'h2';

	return (
		<div
			className={ clsx(
				'block-editor-block-card',
				{
					'is-parent': parentClientId,
					'is-child': isChild,
				},
				className
			) }
		>
			<Stack direction="column" gap="sm">
				<Stack direction="row" align="center" justify="space-between">
					<Stack direction="row" align="center" justify="flex-start">
						{ parentBlockClientId && (
							<Button
								onClick={ () =>
									selectBlock( parentBlockClientId )
								}
								label={
									parentBlockName
										? sprintf(
												/* translators: %s: The name of the parent block. */
												__( 'Go to "%s" block' ),
												// A selected parent block is registered.
												getBlockType( parentBlockName )
													?.title as string
											)
										: __( 'Go to parent block' )
								}
								style={
									// TODO: This style override is also used in ToolsPanelHeader.
									// It should be supported out-of-the-box by Button.
									{ minWidth: 24, padding: 0 }
								}
								icon={ isRTL() ? chevronRight : chevronLeft }
								size="small"
							/>
						) }
						{ isChild && (
							<span className="block-editor-block-card__child-indicator-icon">
								<WCIcon
									icon={ isRTL() ? arrowLeft : arrowRight }
								/>
							</span>
						) }
						<OptionalParentSelectButton
							onClick={
								parentClientId
									? () => {
											selectBlock( parentClientId );
										}
									: undefined
							}
						>
							<BlockIcon icon={ icon } showColors />
							<Stack direction="column" gap="xs">
								<TitleElement className="block-editor-block-card__title">
									<span className="block-editor-block-card__name">
										{ !! name?.length ? name : title }
									</span>
									{ ! parentClientId &&
										! isChild &&
										!! name?.length && (
											// A named card has a title.
											<Badge>{ title as string }</Badge>
										) }
								</TitleElement>
								{ children }
							</Stack>
						</OptionalParentSelectButton>
					</Stack>
					{ controls }
				</Stack>
				{ ! parentClientId && ! isChild && description && (
					<Text className="block-editor-block-card__description">
						{ description }
					</Text>
				) }
			</Stack>
		</div>
	);
}

export default BlockCard;
