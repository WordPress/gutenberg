/**
 * Internal dependencies
 */
import type { FieldLayoutProps, NormalizedPanelLayout } from '../../../types';
import PanelModal from './modal';
import PanelDropdown from './dropdown';

export default function FormPanelField< Item >( {
	data,
	field,
	onChange,
	validity,
}: FieldLayoutProps< Item > ) {
	const layout = field.layout as NormalizedPanelLayout;

	if ( layout.openAs === 'modal' ) {
		return (
			<PanelModal
				data={ data }
				field={ field }
				onChange={ onChange }
				validity={ validity }
			/>
		);
	}

	return (
		<PanelDropdown
			data={ data }
			field={ field }
			onChange={ onChange }
			validity={ validity }
		/>
	);
}
