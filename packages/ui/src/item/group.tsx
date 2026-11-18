import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef, useMemo } from '@wordpress/element';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { GroupContext } from './context';
import type { GroupProps } from './types';

/**
 * A collection of rows. Any mix of `Item.Link`, `Item.Button` and
 * `Item.Row` can go inside, and each becomes one entry of a list.
 *
 * By default the entries are joined in one frame, with a dividing line
 * between them. `separated` gives each its own frame instead.
 *
 * ```jsx
 * <Item.Group aria-labelledby="gateways">
 * 	<Item.Link href="/card">
 * 		<Item.Label>Card payments</Item.Label>
 * 		<Item.Chevron />
 * 	</Item.Link>
 * </Item.Group>
 * ```
 */
export const Group = forwardRef< HTMLUListElement, GroupProps >(
	function ItemGroup(
		{
			className,
			density = 'comfortable',
			frame = true,
			render,
			separated = false,
			...restProps
		},
		ref
	) {
		const context = useMemo(
			() => ( { inGroup: true, density } ),
			[ density ]
		);

		const element = useRender( {
			defaultTagName: 'ul',
			render,
			ref,
			props: mergeProps< 'ul' >(
				{
					// Safari drops list semantics when the markers are
					// removed, so the role has to be stated.
					role: 'list',
					className: clsx(
						defenseStyles.ul,
						resetStyles[ 'box-sizing' ],
						styles.group,
						styles[ `is-${ density }` ],
						separated
							? styles[ 'is-separated' ]
							: styles[ 'is-joined' ],
						frame && styles[ 'has-frame' ],
						className
					),
				},
				restProps
			),
		} );

		return (
			<GroupContext.Provider value={ context }>
				{ element }
			</GroupContext.Provider>
		);
	}
);

Group.displayName = 'Item.Group';
