/**
 * Internal dependencies
 */
import type { DataFormControlProps, FormatNumber } from '../types';
import ValidatedNumber from './utils/validated-number';

export default function Number< Item >( props: DataFormControlProps< Item > ) {
	const decimals = ( props.field.format as FormatNumber )?.decimals ?? 2;
	return <ValidatedNumber { ...props } decimals={ decimals } />;
}
