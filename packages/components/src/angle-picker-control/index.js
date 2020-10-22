/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { FlexBlock, FlexItem } from '../flex';
import NumberControl from '../number-control';
import AngleCircle from './angle-circle';
import { Root } from './styles/angle-picker-control-styles';

export default function AnglePickerControl( {
	className,
	hideLabelFromVision,
	id: idProp,
	label = __( 'Angle' ),
	onChange,
	value,
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
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			label={ label }
			{ ...props }
		>
			<Root>
				<FlexBlock>
					<NumberControl
						className="components-angle-picker-control__input-field"
						id={ id }
						max={ 360 }
						min={ 0 }
						onChange={ handleOnNumberChange }
						step="1"
						value={ value }
					/>
				</FlexBlock>
				<FlexItem>
					<AngleCircle
						aria-hidden="true"
						value={ value }
						onChange={ onChange }
					/>
				</FlexItem>
			</Root>
		</BaseControl>
	);
}
