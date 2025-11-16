/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { __, isRTL } from '@wordpress/i18n';
import {
	chevronLeft,
	chevronRight,
	arrowRight,
	arrowLeft,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';

const { Badge } = unlock( componentsPrivateApis );

function OptionalParentSelectButton( { children, onClick } ) {
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
 * @param {Object}        props                         Component props.
 * @param {string}        props.title                   The title of the block.
 * @param {string|Object} props.icon                    The icon of the block. This can be any of [WordPress' Dashicons](https://developer.wordpress.org/resource/dashicons/), or a custom `svg` element.
 * @param {string}        props.description             The description of the block.
 * @param {Object}        [props.blockType]             Deprecated: Object containing block type data.
 * @param {string}        [props.className]             Additional classes to apply to the card.
 * @param {string}        [props.name]                  Custom block name to display before the title.
 * @param {string}        [props.allowParentNavigation] Show a back arrow to the parent block in some situations.
 * @param {string}        [props.parentClientId]        The parent clientId, if this card is for a parent block.
 * @param {string}        [props.isChild]               Whether the block card is for a child block, in which case, indent the block using an arrow.
 * @param {string}        [props.clientId]              Whether the block card is for a child block, in which case, indent the block using an arrow.
 * @param {Element}       [props.children]              Children.
 * @return {Element}                        Block card component.
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
} ) {
	if ( blockType ) {
		deprecated( '`blockType` property in `BlockCard component`', {
			since: '5.7',
			alternative: '`title, icon and description` properties',
		} );
		( { title, icon, description } = blockType );
	}

	const parentNavBlockClientId = useSelect(
		( select ) => {
			if ( parentClientId || isChild || ! allowParentNavigation ) {
				return;
			}
			const { getBlockParentsByBlockName } = select( blockEditorStore );

			return getBlockParentsByBlockName(
				clientId,
				'core/navigation',
				true
			)[ 0 ];
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
			{ parentNavBlockClientId && ( // This is only used by the Navigation block for now. It's not ideal having Navigation block specific code here.
				<Button
					onClick={ () => selectBlock( parentNavBlockClientId ) }
					label={
						parentNavBlockClientId
							? __( 'Go to parent Navigation block' )
							: // TODO - improve copy, not sure that we should use the term 'section'
							  __( 'Go to parent section' )
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
					<Icon icon={ isRTL() ? arrowLeft : arrowRight } />
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
				<VStack spacing={ 1 }>
					<TitleElement className="block-editor-block-card__title">
						<span className="block-editor-block-card__name">
							{ !! name?.length ? name : title }
						</span>
						{ ! parentClientId && ! isChild && !! name?.length && (
							<Badge>{ title }</Badge>
						) }
					</TitleElement>
					{ ! parentClientId && ! isChild && description && (
						<Text className="block-editor-block-card__description">
							{ description }
						</Text>
					) }
					{ children }
				</VStack>
			</OptionalParentSelectButton>
		</div>
	);
}

export default BlockCard;
