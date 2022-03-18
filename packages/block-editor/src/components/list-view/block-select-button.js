/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, VisuallyHidden } from '@wordpress/components';
import { useDebounce, useInstanceId, usePrevious } from '@wordpress/compose';
import { forwardRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import { getBlockPositionDescription } from './utils';
import BlockTitle from '../block-title';
import ListViewExpander from './expander';
import { SPACE, ENTER } from '@wordpress/keycodes';

function ListViewBlockSelectButton(
	{
		className,
		block: { clientId },
		isSelected,
		onClick,
		onToggleExpanded,
		position,
		siblingBlockCount,
		level,
		tabIndex,
		onFocus,
		onDragStart,
		onDragEnd,
		draggable,
		isExpanded,
		preventAnnouncement,
	},
	ref
) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const instanceId = useInstanceId( ListViewBlockSelectButton );
	const descriptionId = `list-view-block-select-button__${ instanceId }`;
	const blockPositionDescription = getBlockPositionDescription(
		position,
		siblingBlockCount,
		level
	);
	const [ ariaHidden, setAriaHidden ] = useState( undefined );

	// This debounced version is used so that while moving out of focus,
	// the block isn't updated and then re-announced.
	const delaySetAriaHidden = useDebounce( setAriaHidden, 200 );

	// The `href` attribute triggers the browser's native HTML drag operations.
	// When the link is dragged, the element's outerHTML is set in DataTransfer object as text/html.
	// We need to clear any HTML drag data to prevent `pasteHandler` from firing
	// inside the `useOnBlockDrop` hook.
	const onDragStartHandler = ( event ) => {
		event.dataTransfer.clearData();
		onDragStart( event );
	};

	function onKeyDownHandler( event ) {
		if ( event.keyCode === ENTER || event.keyCode === SPACE ) {
			onClick( event );
		}
	}

	const previousPreventAnnouncement = usePrevious( preventAnnouncement );

	useEffect( () => {
		// If we prevent screen readers from announcing the block,
		// we should apply this immediately.
		if ( preventAnnouncement ) {
			setAriaHidden( true );
		}
		// Delay re-enabling so that if focus is being moved between
		// buttons, we don't accidentally re-announce a focused button.
		if ( ! preventAnnouncement && previousPreventAnnouncement ) {
			delaySetAriaHidden( undefined );
		}
	}, [ preventAnnouncement ] );

	return (
		<>
			<Button
				className={ classnames(
					'block-editor-list-view-block-select-button',
					className
				) }
				onClick={ onClick }
				onKeyDown={ onKeyDownHandler }
				aria-describedby={ descriptionId }
				ref={ ref }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				onDragStart={ onDragStartHandler }
				onDragEnd={ onDragEnd }
				draggable={ draggable }
				href={ `#block-${ clientId }` }
				aria-expanded={ isExpanded }
				aria-hidden={ ariaHidden }
			>
				<ListViewExpander onClick={ onToggleExpanded } />
				<BlockIcon icon={ blockInformation?.icon } showColors />
				<BlockTitle clientId={ clientId } maximumLength={ 35 } />
				{ blockInformation?.anchor && (
					<span className="block-editor-list-view-block-select-button__anchor">
						{ blockInformation.anchor }
					</span>
				) }
				{ isSelected && (
					<VisuallyHidden>
						{ __( '(selected block)' ) }
					</VisuallyHidden>
				) }
			</Button>
			<div
				className="block-editor-list-view-block-select-button__description"
				id={ descriptionId }
			>
				{ blockPositionDescription }
			</div>
		</>
	);
}

export default forwardRef( ListViewBlockSelectButton );
