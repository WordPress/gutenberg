/**
 * External dependencies
 */
import type { Reducer } from 'react';

/**
 * Internal dependencies
 */
import type { StyleAction } from './actions';

export type CSSRule = {
	value: string;
};

export type CSSRuleState = {
	[ selector: string ]: CSSRule;
};

export type StateReducer = Reducer< CSSRuleState, StyleAction >;
