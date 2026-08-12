import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

/**
 * Display form of a style value shown in a row whose control is disabled:
 * preset references reduce to their slug, arrays and objects to their parts
 * joined with spaces, anything else prints as written.
 *
 * @param {*} raw The raw style value.
 * @return {string} The display form.
 */
export function displayStyleValue( raw ) {
	if ( raw === undefined || raw === null || raw === '' ) {
		return '';
	}
	if ( typeof raw === 'string' ) {
		return raw.startsWith( 'var:preset|' ) ? raw.split( '|' ).pop() : raw;
	}
	if ( Array.isArray( raw ) ) {
		return raw.map( displayStyleValue ).filter( Boolean ).join( ' ' );
	}
	if ( typeof raw === 'object' ) {
		return Object.values( raw )
			.map( displayStyleValue )
			.filter( Boolean )
			.join( ' ' );
	}
	return String( raw );
}

/**
 * Display form of a box-model value (padding, margin, border radius):
 * a short summary in the manner of the CSS shorthand, e.g. `10px 20px`.
 * When only some sides hold a value, the set sides are joined with spaces.
 *
 * @param {Object|string|undefined} raw   The raw box-model value.
 * @param {string[]}                sides Side keys in shorthand order.
 * @return {string} The display form.
 */
export function displayBoxStyleValue(
	raw,
	sides = [ 'top', 'right', 'bottom', 'left' ]
) {
	if ( ! raw || typeof raw !== 'object' ) {
		return displayStyleValue( raw );
	}
	const parts = sides.map( ( side ) => displayStyleValue( raw[ side ] ) );
	const [ first, second, third, fourth ] = parts;
	if ( parts.every( Boolean ) ) {
		if ( first === second && first === third && first === fourth ) {
			return first;
		}
		if ( first === third && second === fourth ) {
			return `${ first } ${ second }`;
		}
		return parts.join( ' ' );
	}
	return parts.filter( Boolean ).join( ' ' );
}

/**
 * Shown in place of a control whose editor setting is disabled while the
 * block still carries a value: the value stays visible and removable, but
 * cannot be edited. Settings gate controls, not rendering, so without this
 * row a value applied before the restriction (or carried in by pasted or
 * imported content, or a theme switch) could never be removed.
 *
 * @param {Object}   props
 * @param {string}   props.value   Display form of the applied value.
 * @param {Function} props.onReset Removes the value.
 *
 * @return {Element} The row.
 */
export default function GatedValueRow( { value, onReset } ) {
	return (
		<Stack direction="row" justify="space-between" align="center" gap="sm">
			<Text
				style={ {
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
				} }
			>
				<code>{ value }</code>
			</Text>
			<Button
				size="compact"
				variant="secondary"
				onClick={ onReset }
				accessibleWhenDisabled
			>
				{ __( 'Reset' ) }
			</Button>
		</Stack>
	);
}
