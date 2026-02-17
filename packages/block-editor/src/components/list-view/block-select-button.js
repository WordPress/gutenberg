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
	Tooltip,
	VisuallyHidden,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { lockSmall as lock, pinSmall, unseen, symbol } from '@wordpress/icons';
import { SPACE, ENTER } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';

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
import { getBlockVisibilityLabel } from '../block-visibility';
import { useListViewContext } from './context';

const { Badge } = unlock( componentsPrivateApis );

function ListViewBlockSelectButton(
	{
		className,
		block,
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
	const { clientId } = block;
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const { isLocked } = useBlockLock( clientId );
	const { useBlockIcon = () => null } = useListViewContext();
	const { hasPatternName, blockVisibility } = useSelect(
		( select ) => {
			const { getBlockAttributes } = unlock( select( blockEditorStore ) );
			const attributes = getBlockAttributes( clientId );
			return {
				hasPatternName: !! attributes?.metadata?.patternName,
				blockVisibility: attributes?.metadata?.blockVisibility,
			};
		},
		[ clientId ]
	);

	// Call useBlockIcon hook - always defined (defaults to no-op that returns null)
	// Note: useBlockIcon can be a custom hook that uses React hooks,
	// which is valid since we're calling it during render
	// The hook comes from stable context (memoized in ListView), so identity is preserved
	// eslint-disable-next-line react-compiler/react-compiler
	const iconOverride = useBlockIcon( block );

	const shouldShowLockIcon = isLocked;
	const isSticky = blockInformation?.positionType === 'sticky';
	const images = useListViewImages( { clientId, isExpanded } );

	// Determine visibility label from blockVisibility metadata
	const visibilityLabel = getBlockVisibilityLabel( blockVisibility );

	// Compute icon for BlockIcon component
	let blockIcon;
	if ( iconOverride ) {
		blockIcon = {
			src: iconOverride.src,
			foreground: iconOverride.foreground,
		};
	} else if ( hasPatternName ) {
		blockIcon = symbol;
	} else {
		blockIcon = blockInformation?.icon;
	}

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
			<BlockIcon icon={ blockIcon } showColors context="list-view" />
			{ iconOverride?.label && (
				<VisuallyHidden>{ iconOverride.label }</VisuallyHidden>
			) }
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
				{ !! visibilityLabel && (
					<Tooltip text={ visibilityLabel }>
						<span
							className="block-editor-list-view-block-select-button__block-visibility"
							aria-hidden="true"
						>
							<Icon icon={ unseen } />
						</span>
					</Tooltip>
				) }
				{ shouldShowLockIcon && (
					<span className="block-editor-list-view-block-select-button__lock">
						<Icon icon={ lock } />
					</span>
				) }
			</HStack>
		</a>
	);
}

export default forwardRef( ListViewBlockSelectButton );
