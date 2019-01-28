/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { NavigableMenu } from '../navigable-container';

export function MenuGroup( {
	children,
	className = '',
	instanceId,
	label,
} ) {
	if ( ! Children.count( children ) ) {
		return null;
	}

	const labelId = `components-menu-group-label-${ instanceId }`;
	const classNames = classnames(
		className,
		'components-menu-group'
	);

	return (
		<div className={ classNames }>
			{ label &&
				<div className="components-menu-group__label" id={ labelId }>{ label }</div>
			}
			<NavigableMenu orientation="vertical" aria-labelledby={ label ? labelId : null }>
				{ children }
			</NavigableMenu>
		</div>
	);
}

export default withInstanceId( MenuGroup );
