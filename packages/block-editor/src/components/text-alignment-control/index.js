/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Button,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { alignLeft, alignCenter, alignRight } from '@wordpress/icons';

const TEXT_ALIGNMENT_CONTROLS = [
	{
		icon: alignLeft,
		label: __( 'Align text left' ),
		align: 'left',
	},
	{
		icon: alignCenter,
		title: __( 'Align text center' ),
		align: 'center',
	},
	{
		icon: alignRight,
		title: __( 'Align text right' ),
		align: 'right',
	},
];

const DEFAULT_CONTROLS = [ 'left', 'center', 'right' ];

/**
 * Control to facilitate text alignment selections.
 *
 * @param {Object}   props           Component props.
 * @param {string}   props.className Class name to add to the control.
 * @param {string}   props.value     Currently selected text alignment.
 * @param {Function} props.onChange  Handles change in text alignment selection.
 * @param {Array}    props.controls  Array of text align controls to display.
 *
 * @return {Element} Text align control.
 */
export default function TextAlignmentControl( {
	className,
	value,
	onChange,
	controls = DEFAULT_CONTROLS,
} ) {
	const validControls = TEXT_ALIGNMENT_CONTROLS.filter( ( control ) =>
		controls.includes( control.align )
	);

	if ( ! validControls.length ) {
		return null;
	}

	return (
		<fieldset
			className={ classnames(
				'block-editor-text-alignment-control',
				className
			) }
		>
			<BaseControl.VisualLabel as="legend">
				{ __( 'Text alignment' ) }
			</BaseControl.VisualLabel>
			{ /* // 4px of padding makes the row 40px high, same as an input. */ }
			<Spacer marginBottom={ 0 } paddingY={ 1 }>
				<HStack justify="flex-start" spacing={ 1 }>
					{ validControls.map( ( textAlign ) => {
						return (
							<Button
								key={ textAlign.align }
								icon={ textAlign.icon }
								label={ textAlign.label }
								size="compact"
								isPressed={ textAlign.align === value }
								onClick={ () => {
									onChange(
										textAlign.align === value
											? undefined
											: textAlign.align
									);
								} }
							/>
						);
					} ) }
				</HStack>
			</Spacer>
		</fieldset>
	);
}
