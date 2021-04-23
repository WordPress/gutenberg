/**
 * WordPress dependencies
 */
import {
	Button,
	Flex,
	FlexItem,
	FlexBlock,
	BaseControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const isWeb = Platform.OS === 'web';

const CSS_UNITS = [
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '2',
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '.2',
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '.2',
	},
];

/**
 * Control for letter-spacing.
 *
 * @param  {Object}   props                 Component props.
 * @param  {string}   props.value           Currently selected letter-spacing.
 * @param  {Function} props.onChange        Handles change in letter-spacing selection.
 * @return {WPElement}                      Letter-spacing control.
 */
export default function LetterSpacingControl( { value, onChange } ) {
	return (
		<BaseControl
			className="block-editor-letter-spacing-control"
		>
			<BaseControl.VisualLabel>
			{ __( 'Letter-spacing' ) }
			</BaseControl.VisualLabel>
			<Flex>
				<FlexBlock>
					<UnitControl
						value={ value }
						min={ -5 }
						aria-label={ __( 'Letter-spacing' ) }
						__unstableInputWidth="60px"
						units={ CSS_UNITS }
						onChange={ onChange }
					/>
				</FlexBlock>
				<FlexItem>
					<Button
						className="block-editor-letter-spacing__reset-button"
						isSecondary
						disabled={ value === undefined }
						onClick={ () => {
							onChange( undefined );
						} }
					>
						{ __( 'Reset' ) }
					</Button>
				</FlexItem>
			</Flex>
		</BaseControl>
	);
}
