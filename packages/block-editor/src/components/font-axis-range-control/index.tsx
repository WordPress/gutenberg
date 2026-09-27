import {
	RangeControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';

type FontAxisRangeControlProps = {
	/** The control's name, shown on the slider and read by the number field. */
	label: string;
	/** The current value, or undefined when the axis is at its default. */
	value?: number;
	/** The smallest value the faces in use declare. */
	min: number;
	/** The largest value the faces in use declare. */
	max: number;
	/** Where the slider rests when there is no value yet. */
	initialPosition?: number;
	/** Called with the next value, or undefined when the field is emptied. */
	onChange: ( value?: number ) => void;
	/** Said when the current value is outside what the faces declare. */
	outOfRangeNotice?: string;
	/** Added to the wrapper, for a control that needs its own placing. */
	className?: string;
};

/**
 * Picks a number on one of a font's axes: a slider for the range the faces
 * declare, and a field beside it for a value to be typed.
 *
 * Both stay inside that range, which is the point of keeping them together.
 * Each axis reads its range from a different descriptor and stores its value in
 * a different form, and those stay with the controls that know them; what is
 * here is only the part where a number is chosen, so an axis cannot end up
 * offering one the font has no way to draw.
 *
 * A value already saved outside the range is another matter, and the caller
 * says so through `outOfRangeNotice`: it was not typed here, and a font can be
 * changed under a value that suited another one.
 *
 * @param props                  Component props.
 * @param props.label            The control's name.
 * @param props.value            The current value, if the axis has one.
 * @param props.min              The smallest value the faces declare.
 * @param props.max              The largest value the faces declare.
 * @param props.initialPosition  Where the slider rests before a value is set.
 * @param props.onChange         Called with the next value.
 * @param props.outOfRangeNotice Said when the value is outside that range.
 * @param props.className        Added to the wrapper.
 * @return The control.
 */
export default function FontAxisRangeControl( {
	label,
	value,
	min,
	max,
	initialPosition,
	onChange,
	outOfRangeNotice,
	className,
}: FontAxisRangeControlProps ) {
	return (
		<Stack direction="column" gap="xs" className={ className }>
			<Stack
				direction="row"
				gap="md"
				align="flex-end"
				className="block-editor-font-axis-range-control__inputs"
			>
				<RangeControl
					className="block-editor-font-axis-range-control__slider"
					label={ label }
					value={ value }
					initialPosition={ initialPosition }
					min={ min }
					max={ max }
					step={ 1 }
					withInputField={ false }
					onChange={ onChange }
				/>
				{ /*
				 * A field of its own rather than the slider's: a saved value
				 * outside the range is shown as it is, where the slider's own
				 * input hides it.
				 */ }
				<NumberControl
					className="block-editor-font-axis-range-control__number"
					label={ label }
					hideLabelFromVision
					value={ value }
					min={ min }
					max={ max }
					step={ 1 }
					onChange={ ( next?: string ) =>
						onChange(
							next === undefined || next === ''
								? undefined
								: Number( next )
						)
					}
				/>
			</Stack>
			{ outOfRangeNotice && (
				<p className="block-editor-font-axis-range-control__notice">
					{ outOfRangeNotice }
				</p>
			) }
		</Stack>
	);
}
