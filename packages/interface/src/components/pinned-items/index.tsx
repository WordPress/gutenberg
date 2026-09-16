import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Slot, Fill } from '@wordpress/components';
import type { PinnedItemsProps, PinnedItemsSlotProps } from './types';

function PinnedItems( { scope, ...props }: PinnedItemsProps ) {
	return <Fill name={ `PinnedItems/${ scope }` } { ...props } />;
}

function PinnedItemsSlot( {
	scope,
	className,
	...props
}: PinnedItemsSlotProps ) {
	return (
		<Slot name={ `PinnedItems/${ scope }` } { ...props }>
			{ ( fills ) =>
				( fills as ReactNode[] )?.length > 0 && (
					<div
						className={ clsx(
							className,
							'interface-pinned-items'
						) }
					>
						{ fills }
					</div>
				)
			}
		</Slot>
	);
}

PinnedItems.Slot = PinnedItemsSlot;

export default PinnedItems;
