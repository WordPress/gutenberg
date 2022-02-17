/**
 * WordPress dependencies
 */
import { link, linkOff } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Tooltip from '../../tooltip';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useBorderBoxControlLinkedButton } from './hook';

import type { LinkedButtonProps } from '../types';

const BorderBoxControlLinkedButton = (
	props: WordPressComponentProps< LinkedButtonProps, 'div' >,
	forwardedRef: React.Ref< any >
) => {
	const {
		className,
		isLinked,
		...buttonProps
	} = useBorderBoxControlLinkedButton( props );
	const label = isLinked ? __( 'Unlink sides' ) : __( 'Link sides' );

	return (
		<Tooltip text={ label }>
			<div className={ className }>
				<Button
					{ ...buttonProps }
					variant={ isLinked ? 'primary' : 'secondary' }
					isSmall
					icon={ isLinked ? link : linkOff }
					iconSize={ 16 }
					aria-label={ label }
					ref={ forwardedRef }
				/>
			</div>
		</Tooltip>
	);
};

const ConnectedBorderBoxControlLinkedButton = contextConnect(
	BorderBoxControlLinkedButton,
	'BorderBoxControlLinkedButton'
);
export default ConnectedBorderBoxControlLinkedButton;
