/**
 * wordpress/experimental – the utilities to enable private cross-package
 * exports of experimental APIs.
 *
 * This "implementation.js" file is needed for the sake of the unit tests. It
 * exports more than the public API of the package to aid in testing.
 */

/**
 * The list of core modules allowed to opt-in to the experimental APIs.
 */
const CORE_MODULES_USING_EXPERIMENTS = [
	'@wordpress/data',
	'@wordpress/blocks',
	'@wordpress/block-editor',
];

/**
 * A list of core modules that already opted-in to
 * the experiments package.
 */
const registeredExperiments = [];

/*
 * Warning for theme and plugin developers.
 *
 * The use of experimental developer APIs is intended for use by WordPress Core
 * and the Gutenberg plugin exclusively.
 *
 * Dangerously opting in to using these APIs is NOT RECOMMENDED. Furthermore,
 * the WordPress Core philosophy to strive to maintain backward compatibility
 * for third-party developers DOES NOT APPLY to experimental APIs.
 *
 * THE CONSENT STRING FOR OPTING IN TO THESE APIS MAY CHANGE AT ANY TIME AND
 * WITHOUT NOTICE. THIS CHANGE WILL BREAK EXISTING THIRD-PARTY CODE. SUCH A
 * CHANGE MAY OCCUR IN EITHER A MAJOR OR MINOR RELEASE.
 */
const requiredConsent =
	'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.';

export const __dangerousOptInToUnstableAPIsOnlyForCoreModules = (
	consent,
	moduleName
) => {
	if ( ! CORE_MODULES_USING_EXPERIMENTS.includes( moduleName ) ) {
		throw new Error(
			`You tried to opt-in to unstable APIs as a module "${ moduleName }". ` +
				'This feature is only for JavaScript modules shipped with WordPress core. ' +
				'Please do not use it in plugins and themes as the unstable APIs will be removed ' +
				'without a warning. If you ignore this error and depend on unstable features, ' +
				'your product will inevitably break on one of the next WordPress releases.'
		);
	}
	if ( registeredExperiments.includes( moduleName ) ) {
		throw new Error(
			`You tried to opt-in to unstable APIs as a module "${ moduleName }" which is already registered. ` +
				'This feature is only for JavaScript modules shipped with WordPress core. ' +
				'Please do not use it in plugins and themes as the unstable APIs will be removed ' +
				'without a warning. If you ignore this error and depend on unstable features, ' +
				'your product will inevitably break on one of the next WordPress releases.'
		);
	}
	if ( consent !== requiredConsent ) {
		throw new Error(
			`You tried to opt-in to unstable APIs without confirming you know the consequences. ` +
				'This feature is only for JavaScript modules shipped with WordPress core. ' +
				'Please do not use it in plugins and themes as the unstable APIs will removed ' +
				'without a warning. If you ignore this error and depend on unstable features, ' +
				'your product will inevitably break on the next WordPress release.'
		);
	}
	registeredExperiments.push( moduleName );

	return {
		lock,
		unlock,
	};
};

/**
 * Binds private data to an object.
 * It does not alter the passed object in any way, only
 * registers it in an internal map of private data.
 *
 * The private data can't be accessed by any other means
 * than the `unlock` function.
 *
 * @example
 * ```js
 * const object = {};
 * const privateData = { a: 1 };
 * lock( object, privateData );
 *
 * object
 * // {}
 *
 * unlock( object );
 * // { a: 1 }
 * ```
 *
 * @param {Object|Function} object      The object to bind the private data to.
 * @param {any}             privateData The private data to bind to the object.
 */
function lock( object, privateData ) {
	const { experiment } = getLockTargetConfig( object );
	lockedData.set( experiment, {
		privateData,
	} );
}

const identity = ( x ) => x;

/**
 * Unlocks the private data bound to an object.
 *
 * It does not alter the passed object in any way, only
 * returns the private data paired with it using the `lock()`
 * function.
 *
 * @example
 * ```js
 * const object = {};
 * const privateData = { a: 1 };
 * lock( object, privateData );
 *
 * object
 * // {}
 *
 * unlock( object );
 * // { a: 1 }
 * ```
 *
 * @param {any} object The object to unlock the private data from.
 * @return {any} The private data bound to the object.
 */
function unlock( object ) {
	const { experiment, map = identity } = getLockTargetConfig( object );

	const lockedEntry = lockedData.get( experiment ) || {
		privateData: null,
	};

	return map( lockedEntry.privateData );
}

const lockedData = new WeakMap();

/**
 * Used by configureLockTarget() to store the experiment configuration
 * inside lock/unlock targets.
 */
const __lockTargetConfig = Symbol( 'Lock Target' );

/**
 * Configures the locking and unlocking process of a given object. See
 * the examples and `config` parameter below for more details.
 *
 * @example
 * ```js
 *   const experiment = createExperiment();
 *   // Use the same experiment for two objects:
 *   const object1 = {};
 *   configureLockTarget( object1, { experiment } );
 *
 *   const object2 = {};
 *   configureLockTarget( object2, { experiment } );
 *
 *   // Lock the first object:
 *   lock( object1, 'sh' );
 *
 *   // The private data can be accessed via both objects:
 *   unlock( object1 ) // "sh"
 *   unlock( object2 ) // "sh"
 *
 *   // The configuration is preserved through cloning:
 *   const object3 = { ...object1 };
 *   unlock( object3 ) // "sh"
 * ```
 *
 * @example
 * ```js
 *   const experiment = createExperiment();
 *   // Use the same experiment for two objects:
 *   const object = {};
 *   configureLockTarget( object, {
 *     map( privateData ) {
 * 	     return privateData.toUpperCase();
 *     },
 *   } );
 *
 *   lock( object1, 'private' );
 *   unlock( object1 ) // "PRIVATE"
 * ```
 *
 * @param {any}      lockTarget          The object that will later be passed to `lock()` and `unlock()`.
 * @param {Object}   config              The locking configuration.
 * @param {Function} [config.experiment] The experiment to use for locking/unlocking, see `createExperiment()`.
 *                                       If two objects use the same experiment, they will share the same private data.
 * @param {Function} [config.map]        A function to map the private data when `unlock()` is called.
 *                                       It receives the private data as its only argument and returns
 *                                       the updated private data.
 */
export function configureLockTarget( lockTarget, config ) {
	const { map, experiment = createExperiment(), ...rest } = config;
	if ( Object.entries( rest ).length ) {
		throw new Error(
			`Unknown options provided to configureLockingBehavior: ${ Object.keys(
				rest
			).join( ', ' ) }`
		);
	}
	lockTarget[ __lockTargetConfig ] = {
		experiment,
		map,
	};
}

/**
 * Creates a new experiment with unique identity.
 *
 * @return {Object} A new experiment object.
 */
export function createExperiment() {
	// This is a simple object with a unique identity.
	// It's used to identify the private data associated with a given object.
	// See `configureLockTarget()` and `lock()` for more details.
	return {};
}

function getLockTargetConfig( object ) {
	return (
		object[ __lockTargetConfig ] || {
			experiment: object,
		}
	);
}

// Unit tests utilities:

/**
 * Private function to allow the unit tests to allow
 * a mock module to access the experimental APIs.
 *
 * @param {string} name The name of the module.
 */
export function allowCoreModule( name ) {
	CORE_MODULES_USING_EXPERIMENTS.push( name );
}

/**
 * Private function to allow the unit tests to set
 * a custom list of allowed modules.
 */
export function resetAllowedCoreModules() {
	while ( CORE_MODULES_USING_EXPERIMENTS.length ) {
		CORE_MODULES_USING_EXPERIMENTS.pop();
	}
}
/**
 * Private function to allow the unit tests to reset
 * the list of registered experiments.
 */
export function resetRegisteredExperiments() {
	while ( registeredExperiments.length ) {
		registeredExperiments.pop();
	}
}
