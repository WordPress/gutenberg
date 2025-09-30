/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import ValidatedNumber from './utils/validated-number';

export default function Number< Item >( props: DataFormControlProps< Item > ) {
	// TODO: remove this hardcoded value when the decimal number is configurable
	return <ValidatedNumber { ...props } decimals={ 2 } />;
}
