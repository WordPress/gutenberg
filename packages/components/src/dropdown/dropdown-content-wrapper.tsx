import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import type { WordPressComponentProps } from '../context';
import { contextConnect, useContextSystem } from '../context';
import type { DropdownContentWrapperProps } from './types';
import styles from './style.module.scss';

function UnconnectedDropdownContentWrapper(
	props: WordPressComponentProps< DropdownContentWrapperProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		paddingSize = 'small',
		className,
		...derivedProps
	} = useContextSystem( props, 'DropdownContentWrapper' );

	return (
		<div
			{ ...derivedProps }
			className={ clsx(
				styles[ 'content-wrapper' ],
				{
					[ styles[ 'padding-small' ] ]:
						paddingSize !== 'none' && paddingSize !== 'medium',
					[ styles[ 'padding-medium' ] ]: paddingSize === 'medium',
				},
				className
			) }
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
