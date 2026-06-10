/**
 * Internal dependencies
 */
import { defaultSettings } from './defaultSettings';
import stripTags from './stripTags';
import transposeAstralsToCountableChar from './transposeAstralsToCountableChar';
import stripHTMLEntities from './stripHTMLEntities';
import stripConnectors from './stripConnectors';
import stripRemovables from './stripRemovables';
import stripHTMLComments from './stripHTMLComments';
import stripShortcodes from './stripShortcodes';
import stripSpaces from './stripSpaces';
import transposeHTMLEntitiesToCountableChars from './transposeHTMLEntitiesToCountableChars';

import type { Settings, UserSettings, Strategy } from './types';

/**
 * Private function to manage the settings.
 *
 * @param type         The type of count to be done.
 * @param userSettings Custom settings for the count.
 * @return The combined settings object to be used.
 */
function loadSettings(
	type: Strategy = 'words',
	userSettings: UserSettings = {}
): Settings {
	const mergedSettings = { ...defaultSettings, ...userSettings };

	const settings: Settings = {
		...mergedSettings,
		type,
		shortcodes: [],
	};

	settings.shortcodes = settings.l10n?.shortcodes ?? [];

	if ( settings.shortcodes && settings.shortcodes.length ) {
		settings.shortcodesRegExp = new RegExp(
			'\\[\\/?(?:' + settings.shortcodes.join( '|' ) + ')[^\\]]*?\\]',
			'g'
		);
	}

	if (
		settings.type !== 'characters_excluding_spaces' &&
		settings.type !== 'characters_including_spaces'
	) {
		settings.type = 'words';
	}

	return settings;
}

/**
 * Count the words in text
 *
 * @param text     The text being processed
 * @param regex    The regular expression pattern being matched
 * @param settings Settings object containing regular expressions for each strip function
 * @return Count of words.
 */
function countWords( text: string, regex: RegExp, settings: Settings ): number {
	text = [
		stripTags.bind( null, settings ),
		stripHTMLComments.bind( null, settings ),
		stripShortcodes.bind( null, settings ),
		stripSpaces.bind( null, settings ),
		stripHTMLEntities.bind( null, settings ),
		stripConnectors.bind( null, settings ),
		stripRemovables.bind( null, settings ),
	].reduce( ( result, fn ) => fn( result ), text );
	text = text + '\n';
	return text.match( regex )?.length ?? 0;
}

/**
 * Count the characters in text
 *
 * @param text     The text being processed
 * @param regex    The regular expression pattern being matched
 * @param settings Settings object containing regular expressions for each strip function
 * @return Count of characters.
 */
function countCharacters(
	text: string,
	regex: RegExp,
	settings: Settings
): number {
	text = [
		stripTags.bind( null, settings ),
		stripHTMLComments.bind( null, settings ),
		stripShortcodes.bind( null, settings ),
		transposeAstralsToCountableChar.bind( null, settings ),
		stripSpaces.bind( null, settings ),
		transposeHTMLEntitiesToCountableChars.bind( null, settings ),
	].reduce( ( result, fn ) => fn( result ), text );
	text = text + '\n';
	return text.match( regex )?.length ?? 0;
}

/**
 * Count some words.
 *
 * @param text         The text being processed
 * @param type         The type of count. Accepts 'words', 'characters_excluding_spaces', or 'characters_including_spaces'.
 * @param userSettings Custom settings object.
 *
 * @example
 * ```ts
 * import { count } from '@wordpress/wordcount';
 * const numberOfWords = count( 'Words to count', 'words', {} )
 * ```
 *
 * @return The word or character count.
 */
export function count(
	text: string,
	type: Strategy,
	userSettings?: UserSettings
): number {
	const settings = loadSettings( type, userSettings );
	let matchRegExp: RegExp;
	switch ( settings.type ) {
		case 'words':
			matchRegExp = settings.wordsRegExp;
			return countWords( text, matchRegExp, settings );
		case 'characters_including_spaces':
			matchRegExp = settings.characters_including_spacesRegExp;
			return countCharacters( text, matchRegExp, settings );
		case 'characters_excluding_spaces':
			matchRegExp = settings.characters_excluding_spacesRegExp;
			return countCharacters( text, matchRegExp, settings );
		default:
			return 0;
	}
}

// Export types for external usage
export type * from './types';
