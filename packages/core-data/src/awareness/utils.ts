/**
 * Internal dependencies
 */
import type { User } from '../entity-types';
import type { UserInfo } from './types';

/**
 * The color palette for the user highlight.
 */
const COLOR_PALETTE = [
	'#3858E9', // blueberry
	'#B42AED', // purple
	'#E33184', // pink
	'#F3661D', // orange
	'#ECBD3A', // yellow
	'#97FE17', // green
	'#00FDD9', // teal
	'#37C5F0', // cyan
];

/**
 * Generate a random integer between min and max, inclusive.
 *
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @return A random integer between min and max.
 */
function generateRandomInt( min: number, max: number ): number {
	return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
}

/**
 * Get a unique user color from the palette, or generate a variation if none are available.
 * If the previously used color is available from localStorage, use it.
 *
 * @param existingColors - Colors that are already in use.
 * @return The new user color, in hex format.
 */
function getNewUserColor( existingColors: string[] ): string {
	const availableColors = COLOR_PALETTE.filter(
		( color ) => ! existingColors.includes( color )
	);

	let hexColor: string;

	if ( availableColors.length > 0 ) {
		const randomIndex = generateRandomInt( 0, availableColors.length - 1 );
		hexColor = availableColors[ randomIndex ];
	} else {
		// All colors are used, generate a variation of a random palette color
		const randomIndex = generateRandomInt( 0, COLOR_PALETTE.length - 1 );
		const baseColor = COLOR_PALETTE[ randomIndex ];
		hexColor = generateColorVariation( baseColor );
	}

	return hexColor;
}

/**
 * Generate a variation of a hex color by adjusting its lightness.
 *
 * @param hexColor - The base hex color (e.g., '#3858E9').
 * @return A varied hex color.
 */
function generateColorVariation( hexColor: string ): string {
	// Parse hex to RGB
	const r = parseInt( hexColor.slice( 1, 3 ), 16 );
	const g = parseInt( hexColor.slice( 3, 5 ), 16 );
	const b = parseInt( hexColor.slice( 5, 7 ), 16 );

	// Apply a random lightness shift (-30 to +30)
	const shift = generateRandomInt( -30, 30 );
	const newR = Math.min( 255, Math.max( 0, r + shift ) );
	const newG = Math.min( 255, Math.max( 0, g + shift ) );
	const newB = Math.min( 255, Math.max( 0, b + shift ) );

	// Convert back to hex
	const toHex = ( n: number ) =>
		n.toString( 16 ).padStart( 2, '0' ).toUpperCase();
	return `#${ toHex( newR ) }${ toHex( newG ) }${ toHex( newB ) }`;
}

/**
 * Get the browser name from the user agent.
 * @return The browser name.
 */
function getBrowserName(): string {
	const userAgent = window.navigator.userAgent;
	let browserName = 'Unknown';

	if ( userAgent.includes( 'Firefox' ) ) {
		browserName = 'Firefox';
	} else if ( userAgent.includes( 'Edg' ) ) {
		browserName = 'Microsoft Edge';
	} else if (
		userAgent.includes( 'Chrome' ) &&
		! userAgent.includes( 'Edg' )
	) {
		browserName = 'Chrome';
	} else if (
		userAgent.includes( 'Safari' ) &&
		! userAgent.includes( 'Chrome' )
	) {
		browserName = 'Safari';
	} else if (
		userAgent.includes( 'MSIE' ) ||
		userAgent.includes( 'Trident' )
	) {
		browserName = 'Internet Explorer';
	} else if ( userAgent.includes( 'Opera' ) || userAgent.includes( 'OPR' ) ) {
		browserName = 'Opera';
	}

	return browserName;
}

export function areMapsEqual< Key, Value >(
	map1: Map< Key, Value >,
	map2: Map< Key, Value >,
	comparatorFn: ( value1: Value, value2: Value ) => boolean
): boolean {
	if ( map1.size !== map2.size ) {
		return false;
	}

	for ( const [ key, value1 ] of map1.entries() ) {
		if ( ! map2.has( key ) ) {
			return false;
		}

		if ( ! comparatorFn( value1, map2.get( key )! ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Check if two user infos are equal.
 *
 * @param userInfo1 - The first user info.
 * @param userInfo2 - The second user info.
 * @return True if the user infos are equal, false otherwise.
 */
export function areUserInfosEqual(
	userInfo1?: UserInfo,
	userInfo2?: UserInfo
): boolean {
	if ( ! userInfo1 || ! userInfo2 ) {
		return userInfo1 === userInfo2;
	}

	if ( Object.keys( userInfo1 ).length !== Object.keys( userInfo2 ).length ) {
		return false;
	}

	return Object.entries( userInfo1 ).every( ( [ key, value ] ) => {
		// Update this function with any non-primitive fields added to UserInfo.
		return value === userInfo2[ key as keyof UserInfo ];
	} );
}

/**
 * Generate a user info object from a current user and a list of existing colors.
 *
 * @param currentUser    - The current user.
 * @param existingColors - The existing colors.
 * @return The user info object.
 */
export function generateUserInfo(
	currentUser: User< 'view' >,
	existingColors: string[]
): UserInfo {
	return {
		...currentUser,
		browserType: getBrowserName(),
		color: getNewUserColor( existingColors ),
		enteredAt: Date.now(),
	};
}

export function getRecordValue< RecordType, Key extends keyof RecordType >(
	obj: unknown,
	key: Key
): RecordType[ Key ] | null {
	if ( 'object' === typeof obj && null !== obj && key in obj ) {
		return ( obj as RecordType )[ key ];
	}

	return null;
}

export function getTypedKeys< T extends object >( obj: T ): Array< keyof T > {
	return Object.keys( obj ) as Array< keyof T >;
}
