/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { withNextComponent } from '@wordpress/ui.context';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { StyledTextarea } from './styles/textarea-control-styles';
import { TextareaControlNext } from './next';

function TextareaControl( {
	label,
	hideLabelFromVision,
	value,
	help,
	onChange,
	rows = 4,
	className,
	...props
} ) {
	const instanceId = useInstanceId( TextareaControl );
	const id = `inspector-textarea-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<BaseControl
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			help={ help }
			className={ className }
		>
			<StyledTextarea
				className="components-textarea-control__input"
				id={ id }
				rows={ rows }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				value={ value }
				{ ...props }
			/>
		</BaseControl>
	);
}

export default withNextComponent(
	TextareaControl,
	TextareaControlNext,
	'WPComponentsTextareaControl'
);
