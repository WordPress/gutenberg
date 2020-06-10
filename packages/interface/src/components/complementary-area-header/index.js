/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ComplementaryAreaToggle from '../complementary-area-toggle';

const ComplementaryAreaHeader = ( {
	smallScreenTitle,
	children,
	className,
	toggleButtonProps,
} ) => {
	const toggleButton = (
		<ComplementaryAreaToggle icon={ close } { ...toggleButtonProps } />
	);
	return (
		<>
			<div className="components-panel__header interface-complementary-area-header__small">
				{ smallScreenTitle && (
					<span className="interface-complementary-area-header__small-title">
						{ smallScreenTitle }
					</span>
				) }
				{ toggleButton }
			</div>
			<div
				className={ classnames(
					'components-panel__header',
					'interface-complementary-area-header',
					className
				) }
				tabIndex={ -1 }
			>
				{ children }
				{ toggleButton }
			</div>
		</>
	);
};

export default ComplementaryAreaHeader;
