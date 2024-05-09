/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Tooltip,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { Icon, lockSmall as lock, pinSmall } from '@wordpress/icons';
import { SPACE, ENTER } from '@wordpress/keycodes';
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

function ListViewBlockSelectButton(
	{
		className,
		block: { clientId },
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
	const isSticky = blockInformation?.positionType === 'sticky';
	const images = useListViewImages( { clientId, isExpanded } );

	const positionLabel = blockInformation?.positionLabel
		? sprintf(
				// translators: 1: Position of selected block, e.g. "Sticky" or "Fixed".
				__( 'Position: %1$s' ),
				blockInformation.positionLabel
		  )
		: '';

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
		<Button
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
				icon={ blockInformation?.icon }
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
						<Truncate
							className="block-editor-list-view-block-select-button__anchor"
							ellipsizeMode="auto"
						>
							{ blockInformation.anchor }
						</Truncate>
					</span>
				) }
				{ positionLabel && isSticky && (
					<Tooltip text={ positionLabel }>
						<Icon icon={ pinSmall } />
					</Tooltip>
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
				{ isLocked && (
					<span className="block-editor-list-view-block-select-button__lock">
						<Icon icon={ lock } />
					</span>
				) }
			</HStack>
		</Button>
	);
}

export default forwardRef( ListViewBlockSelectButton );
