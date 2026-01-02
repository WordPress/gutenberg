/**
 * WordPress dependencies
 */
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
// Relative import to avoid circular dependencies within the block-editor package.
import { resolveDuotoneColors } from '../duotone/utils';

function DuotoneControl( {
	id: idProp,
	colorPalette,
	duotonePalette,
	disableCustomColors,
	disableCustomDuotone,
	value,
	onChange,
} ) {
	// Resolve CSS custom properties in duotone presets using the color palette.
	// This ensures previews in the picker render correctly with actual colors instead of vars.
	const resolvedDuotonePalette =
		duotonePalette?.map( ( preset ) => ( {
			...preset,
			colors: resolveDuotoneColors( preset.colors, colorPalette ),
		} ) ) || [];

	let toolbarIcon;
	if ( value === 'unset' ) {
		toolbarIcon = (
			<ColorIndicator className="block-editor-duotone-control__unset-indicator" />
		);
	} else if ( value ) {
		// Also resolve the current value if it's a preset slug.
		let resolvedValue = value;
		if (
			typeof value === 'string' &&
			value.startsWith( 'var:preset|duotone|' )
		) {
			const slug = value.split( '|' ).pop();
			const currentPreset = resolvedDuotonePalette.find(
				( p ) => p.slug === slug
			);
			if ( currentPreset ) {
				resolvedValue = currentPreset.colors;
			}
		} else if ( Array.isArray( value ) ) {
			resolvedValue = resolveDuotoneColors( value, colorPalette );
		}
		toolbarIcon = <DuotoneSwatch values={ resolvedValue } />;
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
						duotonePalette={ resolvedDuotonePalette } // Use resolved palette here.
						disableCustomColors={ disableCustomColors }
						disableCustomDuotone={ disableCustomDuotone }
						value={ value } // Pass original value; picker handles selection.
						onChange={ onChange }
					/>
				</MenuGroup>
			) }
		/>
	);
}

export default DuotoneControl;
