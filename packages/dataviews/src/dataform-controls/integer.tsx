/**
 * Internal dependencies
 */
import DataFormNumberControl from './number';
import type { DataFormControlProps } from '../types';

export default function Integer< Item >( props: DataFormControlProps< Item > ) {
	return (
		<DataFormNumberControl
			{ ...props }
			config={ {
				...props?.config,
				step: 1,
			} }
		/>
	);
}
