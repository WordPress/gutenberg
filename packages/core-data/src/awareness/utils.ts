import { __ } from '@wordpress/i18n';
import type { CollaboratorInfo } from './types';

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
 * Check if two collaborator infos are equal.
 *
 * @param collaboratorInfo1 - The first collaborator info.
 * @param collaboratorInfo2 - The second collaborator info.
 * @return True if the collaborator infos are equal, false otherwise.
 */
export function areCollaboratorInfosEqual(
	collaboratorInfo1?: CollaboratorInfo,
	collaboratorInfo2?: CollaboratorInfo
): boolean {
	if ( ! collaboratorInfo1 || ! collaboratorInfo2 ) {
		return collaboratorInfo1 === collaboratorInfo2;
	}

	if (
		Object.keys( collaboratorInfo1 ).length !==
		Object.keys( collaboratorInfo2 ).length
	) {
		return false;
	}

	return Object.entries( collaboratorInfo1 ).every( ( [ key, value ] ) => {
		// Update this function with any non-primitive fields added to CollaboratorInfo.
		return value === collaboratorInfo2[ key as keyof CollaboratorInfo ];
	} );
}

/**
 * Check that awareness information contains the fields required to present a
 * collaborator. Awareness is supplied by peers, so its runtime shape cannot be
 * guaranteed by the local TypeScript type.
 *
 * @param value - The collaborator information to check.
 * @return Whether the collaborator can be presented safely.
 */
export function hasPresentableCollaboratorInfo( value: unknown ): boolean {
	if ( 'object' !== typeof value || null === value ) {
		return false;
	}

	const candidate = value as Record< string, unknown >;
	return (
		Number.isInteger( candidate.id ) &&
		( candidate.id as number ) >= 0 &&
		'string' === typeof candidate.name &&
		'' !== candidate.name.trim() &&
		'number' === typeof candidate.enteredAt &&
		Number.isFinite( candidate.enteredAt )
	);
}

/**
 * Generate a collaborator info object from a current collaborator.
 *
 * @param currentCollaborator - The current collaborator, when available.
 * @param clientId            - The Yjs client ID used for fallback identity.
 * @return The collaborator info object.
 */
export function generateCollaboratorInfo(
	currentCollaborator: unknown,
	clientId: number
): CollaboratorInfo {
	if ( 'object' === typeof currentCollaborator && currentCollaborator ) {
		const user = currentCollaborator as Record< string, unknown >;
		if (
			Number.isInteger( user.id ) &&
			( user.id as number ) > 0 &&
			'string' === typeof user.name &&
			'' !== user.name.trim()
		) {
			const avatarUrls: CollaboratorInfo[ 'avatar_urls' ] = {};

			if ( 'object' === typeof user.avatar_urls && user.avatar_urls ) {
				for ( const size of [ '24', '48', '96' ] as const ) {
					const url = (
						user.avatar_urls as Record< string, unknown >
					 )[ size ];
					if ( 'string' === typeof url ) {
						avatarUrls[ size ] = url;
					}
				}
			}

			return {
				avatar_urls: avatarUrls,
				browserType: getBrowserName(),
				enteredAt: Date.now(),
				id: user.id as number,
				name: user.name,
				slug: 'string' === typeof user.slug ? user.slug : '',
			};
		}
	}

	return {
		avatar_urls: {},
		browserType: getBrowserName(),
		enteredAt: Date.now(),
		id: clientId,
		name: __( 'Anonymous User' ),
		slug: `anonymous-${ clientId }`,
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
