/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import {
	StyledCheck,
	StyledCheckbox,
	StyledContainer,
} from './styles/checkbox-control-styles';

export default function CheckboxControl( {
	label,
	className,
	heading,
	checked,
	help,
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
			help={ help }
			className={ className }
		>
			<StyledContainer className="components-checkbox-control__input-container">
				<StyledCheckbox
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
					<StyledCheck
						icon={ check }
						className="components-checkbox-control__checked"
						role="presentation"
					/>
				) : null }
			</StyledContainer>
			<label
				className="components-checkbox-control__label"
				htmlFor={ id }
			>
				{ label }
			</label>
		</BaseControl>
	);
}
