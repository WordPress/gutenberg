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
import { forwardRef } from '@wordpress/element';
import { Icon, lockSmall as lock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { useBlockLock } from '../block-lock';

function ListViewBlockDraggableChip( { className, clientId }, ref ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const { isLocked } = useBlockLock( clientId );

	return (
		<div className="block-editor-list-view-block-draggable-chip-wrapper">
			<Button
				className={ classnames(
					'block-editor-list-view-block-select-button',
					'block-editor-list-view-block-draggable-chip',
					className
				) }
				ref={ ref }
				tabIndex={ -1 }
				href={ `#block-${ clientId }` }
				aria-hidden={ true }
			>
				<BlockIcon icon={ blockInformation?.icon } showColors />
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
					{ isLocked && (
						<span className="block-editor-list-view-block-select-button__lock">
							<Icon icon={ lock } />
						</span>
					) }
				</HStack>
			</Button>
		</div>
	);
}

export default forwardRef( ListViewBlockDraggableChip );
