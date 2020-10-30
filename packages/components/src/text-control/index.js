/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { withNextComponent } from '@wordpress/ui.context';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { TextControlNext } from './next';

function TextControl( {
	label,
	hideLabelFromVision,
	value,
	help,
	className,
	onChange,
	type = 'text',
	...props
} ) {
	const instanceId = useInstanceId( TextControl );
	const id = `inspector-text-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
		<BaseControl
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			help={ help }
			className={ className }
		>
			<input
				className="components-text-control__input"
				type={ type }
				id={ id }
				value={ value }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props }
			/>
		</BaseControl>
	);
}

export default withNextComponent(
	TextControl,
	TextControlNext,
	'WPComponentsTextControl'
);
