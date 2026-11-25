import { Disabled } from '@wordpress/components';
import type { ReactNode } from 'react';
import useIsStylesLocked from './use-is-styles-locked';

interface DisabledWhenStylesLockedProps {
	/**
	 * The client ID of the block the controls edit, if any.
	 */
	clientId?: string;
	/**
	 * The controls.
	 */
	children?: ReactNode;
}

/**
 * Renders the style controls of a block disabled while its styles are locked,
 * so they can't be changed but stay visible. Only applies with the block lock
 * menu experiment.
 */
export default function DisabledWhenStylesLocked( {
	clientId,
	children,
}: DisabledWhenStylesLockedProps ) {
	const isStylesLocked = useIsStylesLocked( clientId );

	return (
		<Disabled
			isDisabled={ isStylesLocked }
			className={
				isStylesLocked
					? 'block-editor-block-lock__styles-locked'
					: undefined
			}
		>
			{ children }
		</Disabled>
	);
}
