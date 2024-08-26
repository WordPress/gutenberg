/**
 * Internal dependencies
 */
import type { DataFormProps } from '../../types';
import { getFormLayout } from '../../dataforms-layouts';

export default function DataForm< Item >( {
	form,
	...props
}: DataFormProps< Item > ) {
	const layout = getFormLayout( form.type ?? 'regular' );
	if ( ! layout ) {
		return null;
	}

	return <layout.component form={ form } { ...props } />;
}
