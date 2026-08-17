#!/usr/bin/env node
const fs = require( 'fs' );
const path = require( 'path' );
const {
	DEFAULT_AUDIT_START,
	DEFAULT_TRUNK_REF,
	applyEventResolutions,
	auditCandidateDiff,
	auditFrozenReleasedSections,
	auditImmediateBackports,
	auditPreNextReleaseCuts,
	buildPublishInventory,
} = require( './lib/historical-changelog-audit' );
const {
	buildCorrectionLedger,
} = require( './lib/historical-changelog-ledger' );

/**
 * Parses the deliberately small, fail-closed CLI surface.
 *
 * @param {string[]} args CLI arguments.
 * @return {Object} Parsed options.
 */
function parseArgs( args ) {
	const options = {
		repositoryPath: process.cwd(),
		auditStart: DEFAULT_AUDIT_START,
		trunkRef: DEFAULT_TRUNK_REF,
		candidateRef: null,
		eventResolutionsPath: null,
		releaseLanesPath: null,
		immediate: false,
		secondary: false,
		frozen: false,
		candidateDiff: false,
		ledger: false,
		proveShipments: false,
		summaryOnly: false,
		summaryOutputPath: null,
		outputPath: null,
		ledgerOutputPath: null,
		shipmentResolutionsPath: null,
		reviewResolutionsPath: null,
	};

	for ( let index = 0; index < args.length; index++ ) {
		const argument = args[ index ];
		const value = args[ index + 1 ];
		if ( argument === '--repository-path' ) {
			if ( ! value ) {
				throw new Error( '--repository-path requires a value' );
			}
			options.repositoryPath = path.resolve( value );
			index++;
		} else if ( argument === '--audit-start' ) {
			if ( ! value ) {
				throw new Error( '--audit-start requires a value' );
			}
			options.auditStart = value;
			index++;
		} else if ( argument === '--trunk-ref' ) {
			if ( ! value ) {
				throw new Error( '--trunk-ref requires a value' );
			}
			options.trunkRef = value;
			index++;
		} else if ( argument === '--candidate-ref' ) {
			if ( ! value ) {
				throw new Error( '--candidate-ref requires a value' );
			}
			options.candidateRef = value;
			index++;
		} else if ( argument === '--immediate' ) {
			options.immediate = true;
		} else if ( argument === '--event-resolutions' ) {
			if ( ! value ) {
				throw new Error( '--event-resolutions requires a file path' );
			}
			options.eventResolutionsPath = path.resolve( value );
			index++;
		} else if ( argument === '--release-lanes' ) {
			if ( ! value ) {
				throw new Error( '--release-lanes requires a file path' );
			}
			options.releaseLanesPath = path.resolve( value );
			index++;
		} else if ( argument === '--secondary' ) {
			options.secondary = true;
		} else if ( argument === '--frozen' ) {
			options.frozen = true;
		} else if ( argument === '--candidate-diff' ) {
			options.candidateDiff = true;
		} else if ( argument === '--ledger' ) {
			options.ledger = true;
		} else if ( argument === '--prove-shipments' ) {
			options.ledger = true;
			options.proveShipments = true;
		} else if ( argument === '--summary-only' ) {
			options.summaryOnly = true;
		} else if ( argument === '--summary-output' ) {
			if ( ! value ) {
				throw new Error( '--summary-output requires a file path' );
			}
			options.summaryOutputPath = path.resolve( value );
			index++;
		} else if ( argument === '--output' ) {
			if ( ! value ) {
				throw new Error( '--output requires a file path' );
			}
			options.outputPath = path.resolve( value );
			index++;
		} else if ( argument === '--ledger-output' ) {
			if ( ! value ) {
				throw new Error( '--ledger-output requires a file path' );
			}
			options.ledgerOutputPath = path.resolve( value );
			options.ledger = true;
			index++;
		} else if ( argument === '--shipment-resolutions' ) {
			if ( ! value ) {
				throw new Error(
					'--shipment-resolutions requires a file path'
				);
			}
			options.shipmentResolutionsPath = path.resolve( value );
			index++;
		} else if ( argument === '--review-resolutions' ) {
			if ( ! value ) {
				throw new Error( '--review-resolutions requires a file path' );
			}
			options.reviewResolutionsPath = path.resolve( value );
			index++;
		} else {
			throw new Error( `Unknown argument: ${ argument }` );
		}
	}

	return options;
}

function main() {
	const options = parseArgs( process.argv.slice( 2 ) );
	let shipmentResolutions = null;
	if ( options.shipmentResolutionsPath ) {
		try {
			shipmentResolutions = JSON.parse(
				fs.readFileSync( options.shipmentResolutionsPath, 'utf8' )
			);
		} catch ( error ) {
			throw new Error(
				`Could not read shipment resolutions from ${ options.shipmentResolutionsPath }: ${ error.message }`
			);
		}
	}
	let reviewResolutions = null;
	if ( options.reviewResolutionsPath ) {
		try {
			reviewResolutions = JSON.parse(
				fs.readFileSync( options.reviewResolutionsPath, 'utf8' )
			);
		} catch ( error ) {
			throw new Error(
				`Could not read review resolutions from ${ options.reviewResolutionsPath }: ${ error.message }`
			);
		}
	}
	let releaseLanes = null;
	if ( options.releaseLanesPath ) {
		try {
			releaseLanes = JSON.parse(
				fs.readFileSync( options.releaseLanesPath, 'utf8' )
			);
		} catch ( error ) {
			throw new Error(
				`Could not read release lanes from ${ options.releaseLanesPath }: ${ error.message }`
			);
		}
	}
	let inventory = buildPublishInventory( { ...options, releaseLanes } );
	if ( options.eventResolutionsPath ) {
		let resolutions;
		try {
			resolutions = JSON.parse(
				fs.readFileSync( options.eventResolutionsPath, 'utf8' )
			);
		} catch ( error ) {
			throw new Error(
				`Could not read event resolutions from ${ options.eventResolutionsPath }: ${ error.message }`
			);
		}
		inventory = applyEventResolutions( {
			repositoryPath: options.repositoryPath,
			inventory,
			resolutions,
		} );
	}
	const immediate =
		options.immediate || options.ledger
			? auditImmediateBackports( {
					repositoryPath: options.repositoryPath,
					inventory,
			  } )
			: null;
	const secondary =
		options.secondary || options.ledger
			? auditPreNextReleaseCuts( {
					repositoryPath: options.repositoryPath,
					inventory,
			  } )
			: null;
	const frozen =
		options.frozen || options.ledger
			? auditFrozenReleasedSections( {
					repositoryPath: options.repositoryPath,
					inventory,
			  } )
			: null;
	const output =
		options.immediate ||
		options.secondary ||
		options.frozen ||
		options.candidateDiff ||
		options.ledger
			? {
					inventory,
					...( options.immediate ? { immediate } : {} ),
					...( options.secondary ? { secondary } : {} ),
					...( options.frozen || options.ledger ? { frozen } : {} ),
					...( options.candidateDiff
						? {
								candidateDiff: auditCandidateDiff( {
									repositoryPath: options.repositoryPath,
									inventory,
								} ),
						  }
						: {} ),
					...( options.ledger
						? {
								ledger: buildCorrectionLedger( {
									repositoryPath: options.repositoryPath,
									inventory,
									immediate,
									secondary,
									frozen,
									proveShipments: options.proveShipments,
									shipmentResolutions,
									reviewResolutions,
								} ),
						  }
						: {} ),
			  }
			: inventory;
	const printableOutput = options.summaryOnly
		? {
				inventory: output.inventory.summary,
				...( output.immediate
					? {
							immediate: {
								coverage: output.immediate.coverage,
								summary: output.immediate.summary,
							},
					  }
					: {} ),
				...( output.secondary
					? {
							secondary: {
								coverage: output.secondary.coverage,
								summary: output.secondary.summary,
							},
					  }
					: {} ),
				...( output.frozen
					? {
							frozen: {
								coverage: output.frozen.coverage,
								summary: output.frozen.summary,
							},
					  }
					: {} ),
				...( output.ledger
					? {
							ledger: {
								coverage: output.ledger.coverage,
								summary: output.ledger.summary,
								integrityHash: output.ledger.integrityHash,
							},
					  }
					: {} ),
		  }
		: output;
	if ( options.outputPath ) {
		fs.writeFileSync(
			options.outputPath,
			`${ JSON.stringify( output, null, '\t' ) }\n`,
			'utf8'
		);
	}
	if ( options.summaryOutputPath ) {
		fs.writeFileSync(
			options.summaryOutputPath,
			`${ JSON.stringify( printableOutput, null, '\t' ) }\n`,
			'utf8'
		);
	}
	if ( options.ledgerOutputPath ) {
		fs.writeFileSync(
			options.ledgerOutputPath,
			`${ JSON.stringify( output.ledger, null, '\t' ) }\n`,
			'utf8'
		);
	}
	process.stdout.write(
		`${ JSON.stringify( printableOutput, null, '\t' ) }\n`
	);
}

if ( require.main === module ) {
	try {
		main();
	} catch ( error ) {
		console.error(
			error instanceof Error ? error.message : String( error )
		);
		process.exitCode = 1;
	}
}

module.exports = { parseArgs };
