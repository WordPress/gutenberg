/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';

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
				<div
					className="components-menu-group__label" id={ labelId } aria-hidden="true">{ label }</div>
			}
			<div role="group" aria-labelledby={ label ? labelId : null }>
				{ children }
			</div>
		</div>
	);
}

export default withInstanceId( MenuGroup );
