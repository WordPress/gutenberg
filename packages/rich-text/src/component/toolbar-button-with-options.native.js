/**
 * WordPress dependencies
 */
import { Picker, ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { Icon } from '@wordpress/icons';

/**
 * Toolbar button component that, upon a long press, opens a Picker
 * to allow selecting from among multiple options.
 *
 * @param {Object} props         Component props.
 * @param {Object} props.options Options to pick from.
 */
function ToolbarButtonWithOptions( { options } ) {
	const picker = useRef();

	function presentPicker() {
		if ( picker.current ) {
			picker.current.presentPicker();
		}
	}

	function onValueSelected( selectedValue ) {
		const selectedOption = options.find(
			( op ) => op.value === selectedValue
		);
		if ( selectedOption ) {
			selectedOption.onClick();
		}
	}

	if ( ! options || options.length === 0 ) {
		return null;
	}
	const firstOption = options[ 0 ];
	const enablePicker = options.length > 1;

	return (
		<>
			<ToolbarGroup>
				<ToolbarButton
					title={ firstOption.title }
					icon={ <Icon icon={ firstOption.icon } /> }
					onClick={ firstOption.onClick }
					onLongPress={ enablePicker ? presentPicker : undefined }
				/>
			</ToolbarGroup>
			{ enablePicker && (
				<Picker
					ref={ picker }
					options={ options }
					onChange={ onValueSelected }
					hideCancelButton
				/>
			) }
		</>
	);
}

export default ToolbarButtonWithOptions;
