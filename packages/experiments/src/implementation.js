/**
 * Internal module to expose extra utilities to the unit tests but not to
 * any consumers of this package.
 */
const CORE_MODULES_USING_EXPERIMENTS = [
	'@wordpress/data',
	'@wordpress/blocks',
	'@wordpress/block-editor',
];

export function allowCoreModule( name ) {
	CORE_MODULES_USING_EXPERIMENTS.push( name );
}

export function resetAllowedCoreModules() {
	while ( CORE_MODULES_USING_EXPERIMENTS.length ) {
		CORE_MODULES_USING_EXPERIMENTS.pop();
	}
}

const registeredExperiments = {};
export function resetRegisteredExperiments() {
	for ( const key in registeredExperiments ) {
		delete registeredExperiments[ key ];
	}
}

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
	if ( moduleName in registeredExperiments ) {
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
	registeredExperiments[ moduleName ] = true;

	return {
		lock( object, privateData ) {
			const { id } = getLockingConfig( object );
			lockedData.set( id, {
				privateData,
				decorated: false,
			} );
		},
		unlock( object ) {
			const { id, lazyDecorator } = getLockingConfig( object );

			const entry = lockedData.get( id );
			if ( ! entry ) {
				return null;
			}

			let { privateData, decorated } = entry;
			if ( lazyDecorator && ! decorated ) {
				privateData = lazyDecorator( privateData );
				lockedData.set( id, {
					privateData,
					decorated: true,
				} );
			}
			return privateData;
		},
	};
};

const lockedData = new WeakMap();
export const experimentId = Symbol( 'Experiments' );
export const isExperimentsConfig = Symbol( 'ExperimentsConfig' );

function getLockingConfig( object ) {
	if ( ! ( experimentId in object ) ) {
		return {
			id: object,
		};
	}
	const configOrId = object[ experimentId ];
	if ( isExperimentsConfig in configOrId ) {
		return configOrId;
	}
	return {
		id: configOrId,
	};
}

export function configureExperiment( object, config ) {
	const id = getExperimentId( object );
	const { lazyDecorator, ...rest } = config;
	if ( Object.entries( rest ).length ) {
		throw new Error(
			`Unknown options provided to configureLockingBehavior: ${ Object.keys(
				rest
			).join( ', ' ) }`
		);
	}
	object[ experimentId ] = {
		...config,
		id,
		[ isExperimentsConfig ]: true,
	};
}

function getExperimentId( object ) {
	return getLockingConfig( object ).id;
}

export function makeExperimentId() {
	return {};
}
