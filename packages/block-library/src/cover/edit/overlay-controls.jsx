import {
	ColorIndicator,
	Dropdown,
	RangeControl,
	ToolbarButton,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import {
	__experimentalColorGradientControl as ColorGradientControl,
	__experimentalUseGradient as useGradient,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import { Stack } from '@wordpress/ui';
import { unlock } from '../../lock-unlock';

const { isDefaultBlockStyleState } = unlock( blockEditorPrivateApis );

export default function CoverOverlayColorToolbarControl( {
	clientId,
	overlayColor,
	setOverlayColor,
	dimRatio,
	updateDimRatio,
} ) {
	const { gradientValue, setGradient } = useGradient();
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const hasSelectedStyleState = useSelect(
		( select ) => {
			const { getSelectedBlockStyleState } = unlock(
				select( blockEditorStore )
			);
			return ! isDefaultBlockStyleState(
				getSelectedBlockStyleState( clientId )
			);
		},
		[ clientId ]
	);

	if (
		! colorGradientSettings.hasColorsOrGradients ||
		hasSelectedStyleState
	) {
		return null;
	}

	const value = overlayColor.color ?? gradientValue;

	const toolbarIcon = (
		<ColorIndicator
			className="block-editor-panel-color-gradient-settings__color-indicator"
			colorValue={ value }
		/>
	);

	return (
		<Dropdown
			popoverProps={ {
				className: 'block-editor-cover-overlay-color-control__popover',
				headerTitle: __( 'Overlay' ),
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
						label={ __( 'Overlay' ) }
						icon={ toolbarIcon }
					/>
				);
			} }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="medium">
					<Stack direction="column" gap="md">
						<div className="block-editor-panel-color-gradient-settings__dropdown-content">
							<ColorGradientControl
								colorValue={ overlayColor.color }
								gradientValue={ gradientValue }
								label={ __( 'Overlay' ) }
								onColorChange={ setOverlayColor }
								onGradientChange={ setGradient }
								clearable
								showTitle={ false }
								{ ...colorGradientSettings }
							/>
						</div>
						<RangeControl
							label={ __( 'Overlay opacity' ) }
							value={ dimRatio }
							onChange={ ( newDimRatio ) =>
								updateDimRatio( newDimRatio )
							}
							min={ 0 }
							max={ 100 }
							step={ 10 }
							required
						/>
					</Stack>
				</DropdownContentWrapper>
			) }
		/>
	);
}
