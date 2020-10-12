/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Dropdown,
	ToolbarButton,
	ToolbarGroup,
	__experimentalGradientPicker as GradientPicker,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { noFilter } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	getGradientFromColors,
	getGradientFromValues,
	parseGradient,
} from './utils';

function DuotoneToolbar( { value, onChange, options } ) {
	const gradient = getGradientFromValues( value );
	const gradients = options.map( ( { colors, ...rest } ) => ( {
		...rest,
		gradient: getGradientFromColors( colors ),
	} ) );

	const setDuotoneValues = ( newGradient ) => {
		onChange( parseGradient( newGradient ) );
	};

	const toolbarIcon = gradient ? (
		<span
			style={ {
				background: gradient,
				color: 'transparent',
				borderRadius: '50%',
				width: '24px',
				height: '24px',
			} }
		/>
	) : (
		noFilter
	);
	return (
		<Dropdown
			position="bottom right"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						event.stopPropagation();
						onToggle();
					}
				};

				return (
					<ToolbarGroup>
						<ToolbarButton
							showTooltip
							onClick={ onToggle }
							aria-haspopup="true"
							aria-expanded={ isOpen }
							onKeyDown={ openOnArrowDown }
							label={ __( 'Change image color filter' ) }
							icon={ toolbarIcon }
						/>
					</ToolbarGroup>
				);
			} }
			renderContent={ () => (
				<BaseControl>
					<BaseControl.VisualLabel>
						{ __( 'Duotone' ) }
					</BaseControl.VisualLabel>
					<GradientPicker
						disableCustomGradients
						gradients={ gradients }
						value={ gradient }
						onChange={ setDuotoneValues }
					/>
				</BaseControl>
			) }
		/>
	);
}

export default DuotoneToolbar;
