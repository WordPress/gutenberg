/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

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

	const [ touched, setTouched ] = useState( false );
	const handleClose = () => setTouched( true );

	if ( layout.openAs === 'modal' ) {
		return (
			<PanelModal
				data={ data }
				field={ field }
				onChange={ onChange }
				validity={ validity }
				onClose={ handleClose }
				touched={ touched }
			/>
		);
	}

	return (
		<PanelDropdown
			data={ data }
			field={ field }
			onChange={ onChange }
			validity={ validity }
			onClose={ handleClose }
			touched={ touched }
		/>
	);
}
