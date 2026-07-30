/**
 * Node dependencies
 */
import { fileURLToPath } from 'node:url';

/**
 * External dependencies
 */
import { describe, expect, test } from 'vitest';

/**
 * WordPress dependencies
 */
import {
	jsTester,
	phpTester,
} from '@wordpress/block-serialization-spec-parser/shared-tests';

/**
 * Internal dependencies
 */
import { parse } from '../src';

const testRunner = { describe, expect, test };

describe(
	'block-serialization-default-parser-js',
	jsTester( parse, testRunner )
);

phpTester(
	'block-serialization-default-parser-php',
	fileURLToPath( new URL( './test-parser.php', import.meta.url ) ),
	testRunner
);
