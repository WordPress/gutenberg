/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { Icon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { StyledHelp } from '../base-control/styles/base-control-styles';

export default function CheckboxControl( {
	label,
	className,
	heading,
	checked,
	help,
	helpPosition = 'left',
	onChange,
	...props
} ) {
	const instanceId = useInstanceId( CheckboxControl );
	const id = `inspector-checkbox-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( event.target.checked );

	return (
		<BaseControl
			label={ heading }
			id={ id }
			help={ helpPosition === 'left' ? help : '' }
			className={ className }
		>
			<span className="components-checkbox-control__input-container">
				<input
					id={ id }
					className="components-checkbox-control__input"
					type="checkbox"
					value="1"
					onChange={ onChangeValue }
					checked={ checked }
					aria-describedby={ !! help ? id + '__help' : undefined }
					{ ...props }
				/>
				{ checked ? (
					<Icon
						icon={ check }
						className="components-checkbox-control__checked"
						role="presentation"
					/>
				) : null }
			</span>
			<span className="components-checkbox-control__label-container">
				<label
					className="components-checkbox-control__label"
					htmlFor={ id }
				>
					{ label }
				</label>
				{ helpPosition === 'center' && (
					<StyledHelp
						id={ id + '__help' }
						className="components-base-control__help"
					>
						{ help }
					</StyledHelp>
				) }
			</span>
		</BaseControl>
	);
}
