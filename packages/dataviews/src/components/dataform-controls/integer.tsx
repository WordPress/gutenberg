/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import ValidatedNumber from './utils/validated-number';

export default function Integer< Item >( props: DataFormControlProps< Item > ) {
	return <ValidatedNumber { ...props } />;
}
