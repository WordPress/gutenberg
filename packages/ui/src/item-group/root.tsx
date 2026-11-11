import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import type { RootProps } from './types';

/**
 * A list of items that each name something and lead somewhere or offer a
 * control.
 *
 * ```jsx
 * import { ItemGroup } from '@wordpress/ui';
 *
 * function MyComponent() {
 * 	return (
 * 		<ItemGroup.Root aria-label="Payment gateways">
 * 			<ItemGroup.Item title="Card payments" href="/card" />
 * 			<ItemGroup.Item title="Bank transfer" href="/bank" />
 * 		</ItemGroup.Root>
 * 	);
 * }
 * ```
 */
export const Root = forwardRef< HTMLUListElement, RootProps >(
	function ItemGroupRoot(
		{
			className,
			density = 'comfortable',
			variant = 'grouped',
			bordered = true,
			render,
			...restProps
		},
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
						styles.root,
						styles[ `is-${ density }` ],
						styles[ `is-${ variant }` ],
						variant === 'grouped' && bordered && styles.bordered,
						className
					),
				},
				restProps
			),
		} );

		return element;
	}
);

Root.displayName = 'ItemGroup.Root';
