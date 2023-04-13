/**
 * Internal dependencies
 */
import Cell from './cell';

export default function BottomSheetCyclePickerCell( props ) {
	const { value, options, onChangeValue, ...cellProps } = props;

	const nextOptionValue = () => {
		return options[ ( selectedOptionIndex + 1 ) % options.length ].value;
	};

	const selectedOptionIndex = options.findIndex(
		( option ) => option.value === value
	);
	const optionsContainsValue =
		options.length > 0 && selectedOptionIndex !== -1;

	return (
		<Cell
			onPress={ () =>
				optionsContainsValue && onChangeValue( nextOptionValue() )
			}
			editable={ false }
			value={
				optionsContainsValue && options[ selectedOptionIndex ].name
			}
			{ ...cellProps }
		/>
	);
}
