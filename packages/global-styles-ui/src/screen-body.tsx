/**
 * WordPress dependencies
 */
import { __experimentalSpacer as Spacer } from '@wordpress/components';
import clsx from 'clsx';

interface ScreenBodyProps {
	children: React.ReactNode;
	className?: string;
}

export function ScreenBody( { children, className }: ScreenBodyProps ) {
	return (
		<Spacer
			className={ clsx( 'global-styles-ui-screen-body', className ) }
			padding={ 4 } // 4 units = 16px. Could be made configurable via prop in the future if needed.
		>
			{ children }
		</Spacer>
	);
}
