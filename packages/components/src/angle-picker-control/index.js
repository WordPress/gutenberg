/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { FlexBlock } from '../flex';
import NumberControl from '../number-control';
import AngleCircle from './angle-circle';
import {
	Root,
	NumberControlWrapper,
} from './styles/angle-picker-control-styles';

export default function AnglePickerControl( {
	className,
	id: idProp,
	value,
	onChange,
	label,
	...props
} ) {
	const instanceId = useInstanceId(
		AnglePickerControl,
		'components-angle-picker-control__input'
	);
	const id = idProp || instanceId;

	const handleOnNumberChange = ( unprocessedValue ) => {
		const inputValue =
			unprocessedValue !== '' ? parseInt( unprocessedValue, 10 ) : 0;
		onChange( inputValue );
	};

	const classes = classnames( 'components-angle-picker-control', className );

	return (
		<BaseControl
			className={ classes }
			id={ id }
			label={ label }
			{ ...props }
		>
			<Root gap={ 3 }>
				<NumberControlWrapper>
					<NumberControl
						className="components-angle-picker-control__input-field"
						id={ id }
						max={ 360 }
						min={ 0 }
						onChange={ handleOnNumberChange }
						step="1"
						value={ value }
					/>
				</NumberControlWrapper>
				<FlexBlock>
					<AngleCircle
						aria-hidden="true"
						value={ value }
						onChange={ onChange }
					/>
				</FlexBlock>
			</Root>
		</BaseControl>
	);
}
