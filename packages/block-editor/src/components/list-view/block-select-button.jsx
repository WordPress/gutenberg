import clsx from 'clsx';
import { __experimentalTruncate as Truncate } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import {
	Icon,
	lockSmall as lock,
	pinSmall,
	symbol,
	unseen,
} from '@wordpress/icons';
import { SPACE, ENTER } from '@wordpress/keycodes';
import { Stack, Tooltip } from '@wordpress/ui';
import BlockIcon from '../block-icon';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import ListViewExpander from './expander';
import useListViewImages from './use-list-view-images';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function ListViewBlockSelectButton(
	{
		className,
		clientId,
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
		visibilityLabel,
		isDisabled = false,
	},
	ref
) {
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const { icon, anchor, isSticky, isLocked } = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockAttributes,
				getBlock,
				isSectionBlock,
				isLockedBlock,
			} = unlock( select( blockEditorStore ) );
			const { getBlockType, getActiveBlockVariation } =
				select( blocksStore );

			const attributes = getBlockAttributes( clientId );
			const blockName = getBlockName( clientId );

			// Pattern-sourced section blocks show the pattern icon.
			// Everything else resolves its variation or block type icon.
			let blockIcon = symbol;
			if (
				! attributes?.metadata?.patternName ||
				! isSectionBlock( clientId )
			) {
				const match = getActiveBlockVariation(
					blockName,
					attributes,
					undefined,
					getBlock( clientId )?.innerContent
				);
				blockIcon = match?.icon || getBlockType( blockName )?.icon;
			}

			return {
				icon: blockIcon,
				anchor: attributes?.anchor,
				isSticky: attributes?.style?.position?.type === 'sticky',
				isLocked: isLockedBlock( clientId ),
			};
		},
		[ clientId ]
	);

	const shouldShowLockIcon = isLocked;
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

	return (
		// Disabled list view items intentionally omit href so TreeGrid skips them.
		// eslint-disable-next-line jsx-a11y/anchor-is-valid
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
			href={ isDisabled ? undefined : `#block-${ clientId }` }
			aria-disabled={ isDisabled ? true : undefined }
			aria-describedby={ ariaDescribedBy }
			aria-expanded={ isExpanded }
		>
			<ListViewExpander onClick={ onToggleExpanded } />
			<BlockIcon icon={ icon } showColors context="list-view" />
			<Stack
				align="center"
				className="block-editor-list-view-block-select-button__label-wrapper"
				justify="flex-start"
				gap="xs"
			>
				<span className="block-editor-list-view-block-select-button__title">
					<Truncate ellipsizeMode="auto">{ blockTitle }</Truncate>
				</span>
				{ !! anchor && (
					<span className="block-editor-list-view-block-select-button__anchor-wrapper">
						<span className="block-editor-list-view-block-select-button__anchor">
							{ anchor }
						</span>
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
					// The tooltip below is a sighted-hover affordance for
					// the (decorative) visibility icon. The same
					// `visibilityLabel` is exposed to assistive technology
					// via the row's `aria-describedby`, which references the
					// hidden `AriaReferencedText` rendered by the parent
					// `ListViewBlock`.
					<Tooltip.Root>
						<Tooltip.Trigger
							render={
								<span
									className="block-editor-list-view-block-select-button__block-visibility"
									aria-hidden="true"
								>
									<Icon icon={ unseen } />
								</span>
							}
						/>
						<Tooltip.Popup>{ visibilityLabel }</Tooltip.Popup>
					</Tooltip.Root>
				) }
				{ shouldShowLockIcon && (
					<span className="block-editor-list-view-block-select-button__lock">
						<Icon icon={ lock } />
					</span>
				) }
			</Stack>
		</a>
	);
}

export default forwardRef( ListViewBlockSelectButton );
