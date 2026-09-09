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

function hasValidAvatarUrls(
	value: unknown
): value is NonNullable< CollaboratorInfo[ 'avatar_urls' ] > {
	if (
		'object' !== typeof value ||
		null === value ||
		Array.isArray( value )
	) {
		return false;
	}

	return [ '24', '48', '96' ].every(
		( size ) => ! ( size in value ) || 'string' === typeof value[ size ]
	);
}

/**
 * Check that awareness information contains the fields required to present a
 * collaborator. Awareness is supplied by peers, so its runtime shape cannot be
 * guaranteed by the local TypeScript type.
 *
 * @param value - The collaborator information to check.
 * @return Whether the collaborator can be presented safely.
 */
export function isCollaboratorInfo(
	value: unknown
): value is CollaboratorInfo {
	if ( 'object' !== typeof value || null === value ) {
		return false;
	}

	return (
		'id' in value &&
		'name' in value &&
		'slug' in value &&
		'browserType' in value &&
		'enteredAt' in value &&
		( null === value.id ||
			( 'number' === typeof value.id &&
				Number.isInteger( value.id ) &&
				value.id > 0 ) ) &&
		'string' === typeof value.name &&
		'' !== value.name.trim() &&
		'string' === typeof value.slug &&
		( ! ( 'avatar_urls' in value ) ||
			hasValidAvatarUrls( value.avatar_urls ) ) &&
		'string' === typeof value.browserType &&
		'number' === typeof value.enteredAt &&
		Number.isFinite( value.enteredAt )
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
	const presentationInfo = {
		browserType: getBrowserName(),
		enteredAt: Date.now(),
	};

	if ( 'object' === typeof currentCollaborator && currentCollaborator ) {
		const user = currentCollaborator;
		if ( 'id' in user && 'name' in user ) {
			const collaboratorInfo = {
				...presentationInfo,
				...( 'avatar_urls' in user &&
				hasValidAvatarUrls( user.avatar_urls )
					? { avatar_urls: user.avatar_urls }
					: {} ),
				id: user.id,
				name: user.name,
				slug:
					'slug' in user && 'string' === typeof user.slug
						? user.slug
						: '',
			};

			if (
				isCollaboratorInfo( collaboratorInfo ) &&
				null !== collaboratorInfo.id
			) {
				return collaboratorInfo;
			}
		}
	}

	// The Yjs client ID remains available on the surrounding awareness state for
	// session-specific UI identity and also makes the fallback slug deterministic.
	return {
		...presentationInfo,
		id: null,
		// Keep shared awareness data language-neutral. The editor localizes this
		// fallback name for the viewer when it is displayed.
		name: 'Anonymous User',
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
