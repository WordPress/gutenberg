/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
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
import { store as blockEditorStore } from '../../store';

// For this list of hard-coded blocks, the block content will be used as the button label.
// If no content exists, then the block's title will be used as a fallback.
const CONTENT_LABEL_BLOCKS = [ 'core/heading' ];

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

	// Attempt to get block content as the label for the button.
	const contentLabel = useSelect(
		( select ) => {
			let content;
			const block = select( blockEditorStore ).getBlock( clientId );
			if (
				CONTENT_LABEL_BLOCKS.some(
					( blockName ) => blockName === block?.name
				)
			) {
				content = stripHTML( block?.attributes?.content );
			}
			return content;
		},
		[ clientId ]
	);

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
				<HStack
					alignment="center"
					justify="flex-start"
					className="block-editor-list-view-block-select-button__label-wrapper"
				>
					{ contentLabel ? (
						<Truncate
							className="block-editor-list-view-block-select-button__title"
							ellipsizeMode="auto"
						>
							{ contentLabel }
						</Truncate>
					) : (
						<span className="block-editor-list-view-block-select-button__title">
							<BlockTitle
								clientId={ clientId }
								maximumLength={ 35 }
							/>
						</span>
					) }
					{ blockInformation?.anchor && (
						<span className="block-editor-list-view-block-select-button__anchor">
							{ blockInformation.anchor }
						</span>
					) }
				</HStack>
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
