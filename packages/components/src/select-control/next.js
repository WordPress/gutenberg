/**
 * WordPress dependencies
 */
import { FormGroup, Select } from '@wordpress/ui.components';
import { withNextComponent as withNext } from '@wordpress/ui.context';

export function SelectControl( {
	label,
	hideLabelFromVision,
	labelHidden: labelHiddenProp,
	...props
} ) {
	const labelHidden = hideLabelFromVision || labelHiddenProp;

	return (
		<FormGroup label={ label } labelHidden={ labelHidden }>
			<Select { ...props } />
		</FormGroup>
	);
}

export function withNextComponent( current ) {
	return withNext( current, SelectControl, 'WPComponentsSelectControl' );
}
