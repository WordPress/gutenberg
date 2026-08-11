import { _x, sprintf } from '@wordpress/i18n';
import type { User } from '../entity-types';
import type { CollaboratorInfo } from './types';

type CurrentCollaborator = Pick< User< 'view' >, 'id' | 'name' > & {
	avatar_urls?: unknown;
	slug?: unknown;
};

const FALLBACK_COLLABORATOR_ANIMALS = [
	_x( 'Alpaca', 'Animal name for a fallback collaborator' ),
	_x( 'Badger', 'Animal name for a fallback collaborator' ),
	_x( 'Capybara', 'Animal name for a fallback collaborator' ),
	_x( 'Dolphin', 'Animal name for a fallback collaborator' ),
	_x( 'Elephant', 'Animal name for a fallback collaborator' ),
	_x( 'Fox', 'Animal name for a fallback collaborator' ),
	_x( 'Gecko', 'Animal name for a fallback collaborator' ),
	_x( 'Hedgehog', 'Animal name for a fallback collaborator' ),
	_x( 'Lemur', 'Animal name for a fallback collaborator' ),
	_x( 'Meerkat', 'Animal name for a fallback collaborator' ),
	_x( 'Narwhal', 'Animal name for a fallback collaborator' ),
	_x( 'Otter', 'Animal name for a fallback collaborator' ),
	_x( 'Panda', 'Animal name for a fallback collaborator' ),
	_x( 'Rabbit', 'Animal name for a fallback collaborator' ),
	_x( 'Tiger', 'Animal name for a fallback collaborator' ),
	_x( 'Zebra', 'Animal name for a fallback collaborator' ),
];

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
 * Check whether a REST response contains the identity fields required for a
 * named collaborator. Optional presentation fields are normalized separately.
 *
 * @param value - The value to check.
 * @return Whether the value contains a usable WordPress user identity.
 */
export function isCurrentCollaborator(
	value: unknown
): value is CurrentCollaborator {
	if ( 'object' !== typeof value || null === value ) {
		return false;
	}

	const candidate = value as Record< string, unknown >;
	return (
		Number.isInteger( candidate.id ) &&
		( candidate.id as number ) > 0 &&
		'string' === typeof candidate.name &&
		'' !== candidate.name.trim()
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
 * @param currentCollaborator - The current collaborator.
 * @return The collaborator info object.
 */
export function generateCollaboratorInfo(
	currentCollaborator: CurrentCollaborator
): CollaboratorInfo {
	const { avatar_urls: rawAvatarUrls, id, name, slug } = currentCollaborator;
	const avatarUrls: CollaboratorInfo[ 'avatar_urls' ] = {};

	if ( 'object' === typeof rawAvatarUrls && null !== rawAvatarUrls ) {
		for ( const size of [ '24', '48', '96' ] as const ) {
			const url = ( rawAvatarUrls as Record< string, unknown > )[ size ];
			if ( 'string' === typeof url ) {
				avatarUrls[ size ] = url;
			}
		}
	}

	return {
		avatar_urls: avatarUrls,
		browserType: getBrowserName(),
		enteredAt: Date.now(),
		id,
		name,
		slug: 'string' === typeof slug ? slug : '',
		wpUserId: id,
	};
}

/**
 * Generate session-scoped collaborator information when the current WordPress
 * user cannot be resolved. Yjs client IDs are random, so using the client ID to
 * select a name and append a discriminator keeps the identity stable and unique
 * for the session without exposing user data.
 *
 * @param clientId - The Yjs client ID.
 * @return Fallback collaborator information.
 */
export function generateFallbackCollaboratorInfo(
	clientId: number
): CollaboratorInfo {
	const nameIndex = clientId % FALLBACK_COLLABORATOR_ANIMALS.length;
	const discriminator = clientId.toString( 36 ).toUpperCase();
	const name = sprintf(
		// translators: 1: animal name, 2: session discriminator.
		_x( 'Anonymous %1$s · %2$s', 'Name for a fallback collaborator' ),
		FALLBACK_COLLABORATOR_ANIMALS[ nameIndex ],
		discriminator
	);

	return {
		avatar_urls: {},
		browserType: getBrowserName(),
		enteredAt: Date.now(),
		id: clientId,
		name,
		slug: `anonymous-${ clientId }`,
		// Keep `id` numeric for compatibility, but do not mistake the Yjs client
		// ID for a WordPress user ID when exporting or inspecting awareness data.
		wpUserId: null,
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
