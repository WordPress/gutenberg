import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { GroupContext } from './context';
import type { GroupProps } from './types';

/**
 * A list of rows. Any mix of `Item.LinkRow`, `Item.ButtonRow` and
 * `Item.ContentRow` can go inside, and each becomes one item of the list.
 *
 * Name the list with `aria-labelledby` or `aria-label`.
 *
 * ```jsx
 * import { Item } from '@wordpress/ui';
 *
 * function MyComponent() {
 * 	return (
 * 		<Item.Group aria-label="Payment gateways">
 * 			<Item.LinkRow href="/card">
 * 				<Item.Label>Card payments</Item.Label>
 * 				<Item.Chevron />
 * 			</Item.LinkRow>
 * 		</Item.Group>
 * 	);
 * }
 * ```
 */
export const Group = forwardRef< HTMLUListElement, GroupProps >(
	function ItemGroup(
		{ density = 'comfortable', render, variant = 'joined', ...restProps },
		ref
	) {
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
						styles[ `is-${ variant }` ],
						variant === 'joined' && styles[ 'has-frame' ]
					),
				},
				restProps
			),
		} );

		return (
			<GroupContext.Provider value={ variant }>
				{ element }
			</GroupContext.Provider>
		);
	}
);

Group.displayName = 'Item.Group';
