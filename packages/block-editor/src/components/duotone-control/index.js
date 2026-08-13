import {
	ColorIndicator,
	Dropdown,
	DuotonePicker,
	DuotoneSwatch,
	MenuGroup,
	ToolbarButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import { Icon, filter } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';

/**
 * A control for applying duotone filters to media elements. It provides a dropdown menu
 * with predefined filters and options for custom duotone settings.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/duotone-control/README.md
 *
 * @example
 * ```jsx
 * import DuotoneControl from './DuotoneControl';
 *
 * function Example() {
 *   const [value, setValue] = useState('unset');
 *
 *   return (
 *     <DuotoneControl
 *       id="example-duotone-control"
 *       colorPalette={[
 *         { color: '#000000', name: 'Black' },
 *         { color: '#FFFFFF', name: 'White' },
 *         { color: '#FF0000', name: 'Red' },
 *       ]}
 *       duotonePalette={[
 *         { colors: ['#000000', '#FFFFFF'], name: 'Grayscale' },
 *         { colors: ['#FF0000', '#00FF00'], name: 'Sunset' },
 *       ]}
 *       disableCustomColors={false}
 *       disableCustomDuotone={false}
 *       value={value}
 *       onChange={(newValue) => setValue(newValue)}
 *     />
 *   );
 * }
 * ```
 *
 * @param {Object}   props                      Component props.
 * @param {string}   props.id                   Optional ID for the control.
 * @param {Array}    props.colorPalette         Array of color options available for custom duotone.
 * @param {Array}    props.duotonePalette       Array of predefined duotone filter options.
 * @param {boolean}  props.disableCustomColors  Disable custom color options in duotone.
 * @param {boolean}  props.disableCustomDuotone Disable custom duotone filter options.
 * @param {Object}   props.value                The currently selected duotone filter, or 'unset'.
 * @param {Function} props.onChange             Callback triggered when the duotone value changes.
 * @return {Element}  Duotone control dropdown.
 */
function DuotoneControl( {
	id: idProp,
	colorPalette,
	duotonePalette,
	disableCustomColors,
	disableCustomDuotone,
	value,
	onChange,
} ) {
	let toolbarIcon;
	if ( value === 'unset' ) {
		toolbarIcon = (
			<ColorIndicator className="block-editor-duotone-control__unset-indicator" />
		);
	} else if ( value ) {
		toolbarIcon = <DuotoneSwatch values={ value } />;
	} else {
		toolbarIcon = <Icon icon={ filter } />;
	}

	const actionLabel = __( 'Apply duotone filter' );
	const id = useInstanceId( DuotoneControl, 'duotone-control', idProp );
	const descriptionId = `${ id }__description`;

	return (
		<Dropdown
			popoverProps={ {
				className: 'block-editor-duotone-control__popover',
				headerTitle: __( 'Duotone' ),
			} }
			renderToggle={ ( { isOpen, onToggle } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						onToggle();
					}
				};
				return (
					<ToolbarButton
						showTooltip
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onKeyDown={ openOnArrowDown }
						label={ actionLabel }
						icon={ toolbarIcon }
					/>
				);
			} }
			renderContent={ () => (
				<MenuGroup label={ __( 'Duotone' ) }>
					<p>
						{ __(
							'Create a two-tone color effect without losing your original image.'
						) }
					</p>
					<DuotonePicker
						aria-label={ actionLabel }
						aria-describedby={ descriptionId }
						colorPalette={ colorPalette }
						duotonePalette={ duotonePalette }
						disableCustomColors={ disableCustomColors }
						disableCustomDuotone={ disableCustomDuotone }
						value={ value }
						onChange={ onChange }
					/>
				</MenuGroup>
			) }
		/>
	);
}

export default DuotoneControl;
