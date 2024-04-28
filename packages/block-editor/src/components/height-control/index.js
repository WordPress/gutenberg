
/**
 * Internal dependencies
 */
import SizeControl from '../size-control';

/**
 * HeightControl renders a linked unit control and range control for adjusting the height of a block.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/height-control/README.md
 *
 * @param {Object}                     props
 * @param {?string}                    props.label    A label for the control.
 * @param {( value: string ) => void } props.onChange Called when the height changes.
 * @param {string}                     props.value    The current height value.
 *
 * @return {Component} The component to be rendered.
 */
export default function HeightControl( {
	label = __( 'Height' ),
	onChange,
	value,
} ) {
	return (
		<SizeControl label={label} onChange={onChange} value={value} />
	);
}
