/**
 * External dependencies
 */
import classnames from 'classnames';
import { ChromePicker } from 'react-color';
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Dropdown, withContext } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

export function ColorPalette( { defaultColors, colors, value, onChange } ) {
	const usedColors = colors || defaultColors;

	function applyOrUnset( color ) {
		return () => onChange( value === color ? undefined : color );
	}

	return (
		<div className="blocks-color-palette">
			{ map( usedColors, ( color ) => {
				const style = { color: color };
				const className = classnames( 'blocks-color-palette__item', { 'is-active': value === color } );

				return (
					<div key={ color } className="blocks-color-palette__item-wrapper">
						<button
							type="button"
							className={ className }
							style={ style }
							onClick={ applyOrUnset( color ) }
							aria-label={ sprintf( __( 'Color: %s' ), color ) }
							aria-pressed={ value === color }
						/>
					</div>
				);
			} ) }

			<Dropdown
				className="blocks-color-palette__item-wrapper blocks-color-palette__custom-color"
				contentClassName="blocks-color-palette__picker "
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button
						type="button"
						aria-expanded={ isOpen }
						className="blocks-color-palette__item"
						onClick={ onToggle }
						aria-label={ __( 'Custom color picker' ) }
					>
						<span className="blocks-color-palette__custom-color-gradient" />
					</button>
				) }
				renderContent={ () => (
					<ChromePicker
						color={ value }
						onChangeComplete={ ( color ) => onChange( color.hex ) }
						style={ { width: '100%' } }
						disableAlpha
					/>
				) }
			/>

			<button
				className="button-link blocks-color-palette__clear"
				type="button"
				onClick={ () => onChange( undefined ) }
			>
				{ __( 'Clear' ) }
			</button>
		</div>
	);
}

export default withContext( 'editor' )(
	( settings ) => ( {
		defaultColors: settings.colors,
	} )
)( ColorPalette );
