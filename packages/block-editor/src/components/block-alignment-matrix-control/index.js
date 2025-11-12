/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import {
	ToolbarButton,
	Dropdown,
	AlignmentMatrixControl,
} from '@wordpress/components';

const noop = () => {};

/**
 * The alignment matrix control allows users to quickly adjust inner block alignment.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-alignment-matrix-control/README.md
 *
 * @example
 * ```jsx
 * function Example() {
 *   return (
 *     <BlockControls>
 *       <BlockAlignmentMatrixControl
 *         label={ __( 'Change content position' ) }
 *         value="center"
 *         onChange={ ( nextPosition ) =>
 *           setAttributes( { contentPosition: nextPosition } )
 *         }
 *       />
 *     </BlockControls>
 *   );
 * }
 * ```
 *
 * @param {Object}   props            Component props.
 * @param {string}   props.label      Label for the control. Defaults to 'Change matrix alignment'.
 * @param {Function} props.onChange   Function to execute upon change of matrix state.
 * @param {string}   props.value      Content alignment location. One of: 'center', 'center center',
 *                                    'center left', 'center right', 'top center', 'top left',
 *                                    'top right', 'bottom center', 'bottom left', 'bottom right'.
 * @param {boolean}  props.isDisabled Whether the control should be disabled.
 * @return {Element} The BlockAlignmentMatrixControl component.
 */
function BlockAlignmentMatrixControl( props ) {
	const {
		label = __( 'Change matrix alignment' ),
		onChange = noop,
		value = 'center',
		isDisabled,
	} = props;

	const icon = <AlignmentMatrixControl.Icon value={ value } />;

	return (
		<Dropdown
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ ( { onToggle, isOpen } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						onToggle();
					}
				};

				return (
					<ToolbarButton
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onKeyDown={ openOnArrowDown }
						label={ label }
						icon={ icon }
						showTooltip
						disabled={ isDisabled }
					/>
				);
			} }
			renderContent={ () => (
				<AlignmentMatrixControl
					hasFocusBorder={ false }
					onChange={ onChange }
					value={ value }
				/>
			) }
		/>
	);
}

export default BlockAlignmentMatrixControl;
