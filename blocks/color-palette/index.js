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

export function ColorPalette( { colors, disableCustomColors = false, value, onChange, colorMode = 'hex', disableAlpha = true } ) {
	function applyOrUnset( color ) {
		return () => onChange( value === color ? undefined : color );
	}

	return (
		<div className="blocks-color-palette">
			{ map( colors, ( color ) => {
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

			{ ! disableCustomColors &&
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
							// onChangeComplete={ ( color ) => onChange( color.rgb ) }
							onChangeComplete={ ( color ) => {
								if ( typeof color[ colorMode ] !== 'undefined' ) {
									let colorString;
									switch ( colorMode ) {
										case 'rgb':
											colorString = sprintf( __( 'rgba(%s,%s,%s,%s)' ), color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a );
											break;
										case 'hsl':
											colorString = sprintf( __( 'hsla(%s,%s,%s,%s)' ), color.rgb.h, color.rgb.s, color.rgb.l, color.rgb.a );
											break;
										default:
											colorString = color.hex;
											break;
									}
									onChange( colorString );
								} else {
									onChange( color.hex );
								}
							} }
							style={ { width: '100%' } }
							disableAlpha={ disableAlpha }
						/>
					) }
				/>
			}

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
	( settings, props ) => ( {
		colors: props.colors || settings.colors,
		disableCustomColors: props.disableCustomColors !== undefined ?
			props.disableCustomColors :
			settings.disableCustomColors,
	} )
)( ColorPalette );
