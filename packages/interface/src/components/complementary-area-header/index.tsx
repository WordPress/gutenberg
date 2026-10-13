import clsx from 'clsx';
import { closeSmall } from '@wordpress/icons';
import ComplementaryAreaToggle from '../complementary-area-toggle';
import type { ComplementaryAreaHeaderProps } from './types';

const ComplementaryAreaHeader = ( {
	children,
	className,
	toggleButtonProps,
}: ComplementaryAreaHeaderProps ) => {
	const toggleButton = (
		<ComplementaryAreaToggle icon={ closeSmall } { ...toggleButtonProps } />
	);
	return (
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
	);
};

export default ComplementaryAreaHeader;
