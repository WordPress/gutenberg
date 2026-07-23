/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
/* eslint-disable @wordpress/use-recommended-components -- Used here because it supports rendering as a `span` via the `render` prop to avoid invalid HTML. */
import {
	Badge,
	Button,
	Popover,
	Stack,
	Tooltip,
	VisuallyHidden,
} from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

const DEFAULT_MAX = 3;

type OverflowingBadgesProps = {
	items: Array< { key: string; label: string } >;
	max?: number;
};

export function OverflowingBadges( {
	items,
	max = DEFAULT_MAX,
}: OverflowingBadgesProps ) {
	const visible = items.slice( 0, max );
	const hidden = items.slice( max );
	const moreLabel = sprintf(
		/* translators: %d: number of additional items */
		_n( 'Show %d more', 'Show %d more', hidden.length ),
		hidden.length
	);
	const popoverTitle = sprintf(
		/* translators: %d: number of additional items */
		_n( '%d more item', '%d more items', hidden.length ),
		hidden.length
	);
	return (
		<Stack
			direction="row"
			wrap="wrap"
			gap="xs"
			align="center"
			render={ <span /> }
		>
			{ visible.map( ( item ) => (
				<Badge key={ item.key }>{ item.label }</Badge>
			) ) }
			{ hidden.length > 0 && (
				<Tooltip.Provider delay={ 0 }>
					<Tooltip.Root>
						<Popover.Root>
							<Tooltip.Trigger
								render={
									<Popover.Trigger
										render={
											<Button
												variant="outline"
												tone="neutral"
												size="small"
												aria-label={ moreLabel }
												style={ {
													minWidth: 'auto',
													borderRadius:
														'var(--wpds-border-radius-lg)',
													fontWeight: 'normal',
												} }
											>
												{ sprintf(
													/* translators: %d: number of additional items */
													__( '+%d' ),
													hidden.length
												) }
											</Button>
										}
									/>
								}
							/>
							<Popover.Popup style={ { maxWidth: 320 } }>
								<VisuallyHidden render={ <Popover.Title /> }>
									{ popoverTitle }
								</VisuallyHidden>
								<Stack direction="row" wrap="wrap" gap="xs">
									{ hidden.map( ( item ) => (
										<Badge key={ item.key }>
											{ item.label }
										</Badge>
									) ) }
								</Stack>
							</Popover.Popup>
							<Tooltip.Popup>{ moreLabel }</Tooltip.Popup>
						</Popover.Root>
					</Tooltip.Root>
				</Tooltip.Provider>
			) }
		</Stack>
	);
}
