/**
 * External dependencies
 */
import { contextConnect } from '@wp-g2/context';
import { Separator } from 'reakit/Separator';

/**
 * Internal dependencies
 */
import { useDivider } from './use-divider';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'hr'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function Divider( props, forwardedRef ) {
	const otherProps = useDivider( props );

	return <Separator { ...otherProps } ref={ forwardedRef } />;
}

export default contextConnect( Divider, 'Divider' );
