/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../ui/context';
// eslint-disable-next-line no-duplicate-imports
import type { ViewOwnProps } from '../ui/context';
import { Divider } from '../divider';
// eslint-disable-next-line no-duplicate-imports
import type { DividerProps } from '../divider';

export interface SeparatorProps extends DividerProps {}

function Separator(
	props: ViewOwnProps< SeparatorProps, 'hr' >,
	forwardedRef: Ref< any >
) {
	const { marginBottom = 3, marginTop = 3, ...otherProps } = useContextSystem(
		props,
		'Separator'
	);

	return (
		<Divider
			{ ...otherProps }
			marginBottom={ marginBottom }
			marginTop={ marginTop }
			ref={ forwardedRef }
		/>
	);
}

export default contextConnect( Separator, 'Separator' );
