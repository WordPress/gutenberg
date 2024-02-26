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
import { View } from '../../view';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { useBorderBoxControlLinkedButton } from './hook';

import type { LinkedButtonProps } from '../types';

const BorderBoxControlLinkedButton = (
	props: WordPressComponentProps< LinkedButtonProps, 'button' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const { className, isLinked, ...buttonProps } =
		useBorderBoxControlLinkedButton( props );
	const label = isLinked ? __( 'Unlink sides' ) : __( 'Link sides' );

	return (
		<Tooltip text={ label }>
			<View className={ className }>
				<Button
					{ ...buttonProps }
					size="small"
					icon={ isLinked ? link : linkOff }
					iconSize={ 24 }
					aria-label={ label }
					ref={ forwardedRef }
				/>
			</View>
		</Tooltip>
	);
};

const ConnectedBorderBoxControlLinkedButton = contextConnect(
	BorderBoxControlLinkedButton,
	'BorderBoxControlLinkedButton'
);
export default ConnectedBorderBoxControlLinkedButton;
