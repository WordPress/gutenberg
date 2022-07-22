/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import {
	WordPressComponentProps,
	contextConnect,
	useContextSystem,
} from '../ui/context';
import { DropdownContentWrapperDiv } from './styles';
import type { DropdownContentWrapperProps } from './types';

function UnconnectedDropdownContentWrapper(
	props: WordPressComponentProps< DropdownContentWrapperProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	const { paddingSize = 'small', ...derivedProps } = useContextSystem(
		props,
		'DropdownContentWrapper'
	);

	return (
		<DropdownContentWrapperDiv
			{ ...derivedProps }
			paddingSize={ paddingSize }
			ref={ forwardedRef }
		/>
	);
}

/**
 * A convenience wrapper for the `renderContent` when you want to apply
 * different padding. (Default is `paddingSize="small"`).
 *
 * ```jsx
 * import {
 *   Dropdown,
 *   __experimentalDropdownContentWrapper as DropdownContentWrapper,
 * } from '@wordpress/components';
 *
 * <Dropdown
 *   renderContent={ () => (
 *     <DropdownContentWrapper paddingSize="medium">
 *       My dropdown content
 *     </DropdownContentWrapper>
 * ) }
 * />
 * ```
 */
export const DropdownContentWrapper = contextConnect(
	UnconnectedDropdownContentWrapper,
	'DropdownContentWrapper'
);

export default DropdownContentWrapper;
