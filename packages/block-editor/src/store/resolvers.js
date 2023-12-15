/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

export const __experimentalGetParsedPattern =
	( patternName ) =>
	async ( { select, dispatch } ) => {
		const patterns = select(
			( state ) => state.root.settings.__experimentalBlockPatterns
		);
		const unsyncedPatterns = select.getUnsyncedPatterns();

		const pattern = [ ...patterns, ...unsyncedPatterns ].find(
			( { name } ) => name === patternName
		);

		if ( ! pattern ) {
			return;
		}

		const blocks = await parse( pattern.content, {
			__unstableSkipMigrationLogs: true,
		} );

		const parsedPattern = { ...pattern, blocks };

		dispatch( {
			type: 'SET_PARSED_PATTERN',
			patternName: pattern.name,
			parsedPattern,
		} );
	};

export const __experimentalGetAllowedPatterns =
	() =>
	async ( { select, dispatch } ) => {
		const patterns = select(
			( state ) => state.root.settings.__experimentalBlockPatterns
		);
		const unsyncedPatterns = select.getUnsyncedPatterns();

		const inserterPatterns = [ ...patterns, ...unsyncedPatterns ].filter(
			( { inserter = true } ) => inserter
		);

		for ( const pattern of inserterPatterns ) {
			const blocks = await parse( pattern.content, {
				__unstableSkipMigrationLogs: true,
			} );

			const parsedPattern = { ...pattern, blocks };

			dispatch( {
				type: 'SET_PARSED_PATTERN',
				patternName: pattern.name,
				parsedPattern,
			} );
		}
	};

__experimentalGetAllowedPatterns.shouldInvalidate = ( action ) => {
	return (
		action.type === 'UPDATE_SETTINGS' &&
		action.settings.__experimentalBlockPatterns
	);
};

export const getPatternsByBlockTypes = __experimentalGetAllowedPatterns;
