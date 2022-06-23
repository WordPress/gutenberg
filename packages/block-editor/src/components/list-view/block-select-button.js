/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { Icon, lock } from '@wordpress/icons';
import { SPACE, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import BlockTitle from '../block-title';
import ListViewExpander from './expander';
import { useBlockLock } from '../block-lock';

function ListViewBlockSelectButton(
	{
		className,
		block: { clientId },
		onClick,
		onToggleExpanded,
		tabIndex,
		onFocus,
		onDragStart,
		onDragEnd,
		draggable,
	},
	ref
) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const { isLocked } = useBlockLock( clientId );

	// The `href` attribute triggers the browser's native HTML drag operations.
	// When the link is dragged, the element's outerHTML is set in DataTransfer object as text/html.
	// We need to clear any HTML drag data to prevent `pasteHandler` from firing
	// inside the `useOnBlockDrop` hook.
	const onDragStartHandler = ( event ) => {
		event.dataTransfer.clearData();
		onDragStart?.( event );
	};

	function onKeyDownHandler( event ) {
		if ( event.keyCode === ENTER || event.keyCode === SPACE ) {
			onClick( event );
		}
	}

	return (
		<>
			<Button
				className={ classnames(
					'block-editor-list-view-block-select-button',
					className
				) }
				onClick={ onClick }
				onKeyDown={ onKeyDownHandler }
				ref={ ref }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
				onDragStart={ onDragStartHandler }
				onDragEnd={ onDragEnd }
				draggable={ draggable }
				href={ `#block-${ clientId }` }
				aria-hidden={ true }
			>
				<ListViewExpander onClick={ onToggleExpanded } />
				<BlockIcon icon={ blockInformation?.icon } showColors />
				<span className="block-editor-list-view-block-select-button__title">
					<BlockTitle
						clientId={ clientId }
						maximumLength={ 35 }
						context="list-view"
					/>
				</span>
				{ blockInformation?.anchor && (
					<span className="block-editor-list-view-block-select-button__anchor">
						{ blockInformation.anchor }
					</span>
				) }
				{ isLocked && (
					<span className="block-editor-list-view-block-select-button__lock">
						<Icon icon={ lock } />
					</span>
				) }
			</Button>
		</>
	);
}

export default forwardRef( ListViewBlockSelectButton );
