/**
 * Internal dependencies
 */
import {
	SET_GUIDELINES,
	SET_DRAFT,
	SET_SAVING,
	SET_PUBLISHING,
	SET_ERROR,
	SET_REVISIONS,
	SET_RESTORING,
	SET_TEST_RESULTS,
	SET_RUNNING_TEST,
} from './actions';

/**
 * Normalize block keys from storage format (coreparagraph) to standard format (core/paragraph).
 * WordPress strips slashes from meta keys, so we need to restore them.
 *
 * @param {Object} blocks Blocks object with stripped keys.
 * @return {Object} Blocks object with normalized keys.
 */
function normalizeBlockKeys( blocks ) {
	if ( ! blocks || typeof blocks !== 'object' ) {
		return blocks;
	}

	const normalized = {};
	const namespaces = [ 'core', 'jetpack', 'woocommerce', 'generateblocks', 'kadence', 'stackable', 'spectra', 'otter' ];

	for ( const [ key, value ] of Object.entries( blocks ) ) {
		// If already has a slash, keep as-is
		if ( key.includes( '/' ) ) {
			normalized[ key ] = value;
			continue;
		}

		// Try to match a known namespace prefix
		let matched = false;
		for ( const ns of namespaces ) {
			if ( key.startsWith( ns ) && key.length > ns.length ) {
				const blockName = key.slice( ns.length );
				// Handle hyphenated names like 'media-text'
				normalized[ `${ ns }/${ blockName }` ] = value;
				matched = true;
				break;
			}
		}

		// If no namespace matched, keep original key
		if ( ! matched ) {
			normalized[ key ] = value;
		}
	}

	return normalized;
}

/**
 * Normalize guidelines data, fixing block keys.
 *
 * @param {Object} guidelines Guidelines object.
 * @return {Object} Normalized guidelines.
 */
function normalizeGuidelines( guidelines ) {
	if ( ! guidelines ) {
		return guidelines;
	}

	return {
		...guidelines,
		blocks: normalizeBlockKeys( guidelines.blocks ),
	};
}

/**
 * Default state.
 */
const DEFAULT_STATE = {
	active: null,
	draft: null,
	postId: null,
	updatedAt: null,
	revisionCount: 0,
	isSaving: false,
	isPublishing: false,
	error: null,
	revisions: [],
	isRestoring: false,
	testResults: null,
	isRunningTest: false,
};

/**
 * Reducer.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Action object.
 * @return {Object} New state.
 */
export default function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case SET_GUIDELINES:
			return {
				...state,
				active: normalizeGuidelines( action.payload.active ),
				draft: normalizeGuidelines( action.payload.draft ) || state.draft,
				postId: action.payload.post_id,
				updatedAt: action.payload.updated_at,
				revisionCount: action.payload.revision_count,
			};

		case SET_DRAFT:
			return {
				...state,
				draft: action.payload,
			};

		case SET_SAVING:
			return {
				...state,
				isSaving: action.payload,
			};

		case SET_PUBLISHING:
			return {
				...state,
				isPublishing: action.payload,
			};

		case SET_ERROR:
			return {
				...state,
				error: action.payload,
			};

		case SET_REVISIONS:
			return {
				...state,
				revisions: action.payload,
			};

		case SET_RESTORING:
			return {
				...state,
				isRestoring: action.payload,
			};

		case SET_TEST_RESULTS:
			return {
				...state,
				testResults: action.payload,
			};

		case SET_RUNNING_TEST:
			return {
				...state,
				isRunningTest: action.payload,
			};

		default:
			return state;
	}
}
