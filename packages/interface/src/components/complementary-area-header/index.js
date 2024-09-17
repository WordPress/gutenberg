/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { closeSmall } from '@wordpress/icons';

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
		<ComplementaryAreaToggle icon={ closeSmall } { ...toggleButtonProps } />
	);
	return (
		<>
			<div className="components-panel__header interface-complementary-area-header__small">
				{ smallScreenTitle && (
					<h2 className="interface-complementary-area-header__small-title">
						{ smallScreenTitle }
					</h2>
				) }
				{ toggleButton }
			</div>
			<div
				className={ clsx(
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
