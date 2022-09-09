/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	reset,
	formatCapitalize,
	formatLowercase,
	formatUppercase,
} from '@wordpress/icons';

/**
 * Control to facilitate text transform selections.
 *
 * @param {Object}   props            Component props.
 * @param {string}   props.value      Currently selected text transform.
 * @param {Function} props.onChange   Handles change in text transform selection.
 * @param {boolean}  [props.showNone] Whether to display the 'None' option.
 *
 * @return {WPElement} Text transform control.
 */
export default function TextTransformControl( {
	value,
	onChange,
	showNone,
	...props
} ) {
	return (
		<ToggleGroupControl
			{ ...props }
			className="block-editor-text-transform-control"
			label={ __( 'Letter case' ) }
			value={ value ?? 'none' }
			onChange={ ( nextValue ) => {
				onChange( nextValue === 'none' ? undefined : nextValue );
			} }
		>
			{ showNone && (
				<ToggleGroupControlOptionIcon
					value="none"
					icon={ reset }
					label={ __( 'None' ) }
				/>
			) }
			<ToggleGroupControlOptionIcon
				value="uppercase"
				icon={ formatUppercase }
				label={ __( 'Uppercase' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="lowercase"
				icon={ formatLowercase }
				label={ __( 'Lowercase' ) }
			/>
			<ToggleGroupControlOptionIcon
				value="capitalize"
				icon={ formatCapitalize }
				label={ __( 'Capitalize' ) }
			/>
		</ToggleGroupControl>
	);
}
