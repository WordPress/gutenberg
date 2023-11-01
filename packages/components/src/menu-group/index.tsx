/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { MenuGroupProps } from './types';

/**
 * `MenuGroup` wraps a series of related `MenuItem` components into a common
 * section.
 *
 * ```jsx
 * import { MenuGroup, MenuItem } from '@wordpress/components';
 *
 * const MyMenuGroup = () => (
 *   <MenuGroup label="Settings">
 *     <MenuItem>Setting 1</MenuItem>
 *     <MenuItem>Setting 2</MenuItem>
 *   </MenuGroup>
 * );
 * ```
 */
export function MenuGroup( props: MenuGroupProps ) {
	const { children, className = '', label, hideSeparator } = props;
	const instanceId = useInstanceId( MenuGroup );

	if ( ! Children.count( children ) ) {
		return null;
	}

	const labelId = `components-menu-group-label-${ instanceId }`;
	const classNames = classnames( className, 'components-menu-group', {
		'has-hidden-separator': hideSeparator,
	} );

	return (
		<div className={ classNames }>
			{ label && (
				<div
					className="components-menu-group__label"
					id={ labelId }
					aria-hidden="true"
				>
					{ label }
				</div>
			) }
			<div role="group" aria-labelledby={ label ? labelId : undefined }>
				{ children }
			</div>
		</div>
	);
}

export default MenuGroup;
