import { useSelect } from '@wordpress/data';
import { Disabled } from '@wordpress/components';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

interface DisabledWhenDesignLockedProps {
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
 * Renders the controls of a block disabled while its design is locked, so its
 * content and styles can't be changed but the controls stay visible. Only
 * applies with the block lock menu experiment.
 */
export default function DisabledWhenDesignLocked( {
	clientId,
	children,
}: DisabledWhenDesignLockedProps ) {
	const isDesignLocked = useSelect(
		( select ) =>
			!! window.__experimentalBlockLockMenu &&
			!! clientId &&
			unlock( select( blockEditorStore ) ).isEditLockedBlock( clientId ),
		[ clientId ]
	);

	return (
		<Disabled
			isDisabled={ isDesignLocked }
			className={
				isDesignLocked
					? 'block-editor-block-lock__design-locked'
					: undefined
			}
		>
			{ children }
		</Disabled>
	);
}
