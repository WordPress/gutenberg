/**
 * External dependencies
 */
import { flow } from 'lodash';
import { html } from 'hpq';
import { Parser } from 'html-to-react';

export * from 'hpq';

const parser = new Parser();
export function children( selector ) {
	return flow( html( selector ), parser.parse );
}
