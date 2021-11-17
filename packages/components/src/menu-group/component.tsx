/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../ui/context';
import { useMenuGroup } from './hook';
import type { MenuGroupProps } from './types';
import { View } from '../view';

function useUniqueId() {
	return `components-menu-group-label-${ useInstanceId( MenuGroup ) }`;
}

function MenuGroup(
	props: WordPressComponentProps< MenuGroupProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const {
		children,
		label,
		menuGroupClassName,
		menuGroupLabelClassName,
	} = useMenuGroup( props );

	const labelId = useUniqueId();

	if ( ! Children.count( children ) ) {
		return null;
	}

	return (
		<View className={ menuGroupClassName } ref={ forwardedRef }>
			{ label && (
				<View
					className={ menuGroupLabelClassName }
					id={ labelId }
					aria-hidden="true"
				>
					{ label }
				</View>
			) }
			<View role="group" aria-labelledby={ label ? labelId : undefined }>
				{ children }
			</View>
		</View>
	);
}

/**
 * `MenuGroup` wraps a series of related `MenuItem` components into a common section.
 *
 * @example
 * ```jsx
 * import { MenuGroup } from `@wordpress/components`
 *
 * function Example() {
 *   return (
 *      <MenuGroup label="Settings">
 *          <MenuItem>Setting 1</MenuItem>
 *          <MenuItem>Setting 2</MenuItem>
 *      </MenuGroup>
 *   );
 * }
 * ```
 */
const ConnectedMenuGroup = contextConnect( MenuGroup, 'MenuGroup' );

export default ConnectedMenuGroup;
