/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import { NavigableMenu } from '../navigable-container';
import withInstanceId from '../higher-order/with-instance-id';

function MenuItemsGroup( {
	label,
	children,
	instanceId,
	className = '',
} ) {
	const labelId = `components-menu-items-group-label-${ instanceId }`;
	const classNames = classnames( className, 'components-menu-items-group' );

	return (
		<div className={ classNames }>
			{ label &&
				<div className="components-menu-items-group__label" id={ labelId }>{ label }</div>
			}
			<NavigableMenu orientation="vertical" aria-labelledby={ labelId }>
				{ children }
			</NavigableMenu>
		</div>
	);
}

export default withInstanceId( MenuItemsGroup );
