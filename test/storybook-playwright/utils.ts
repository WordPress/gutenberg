/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

const STORYBOOK_PORT = '50241';

type Decorators = {
	css?: 'none' | 'basic' | 'wordpress';
	direction?: 'ltr' | 'rtl';
	marginChecker?: 'show' | 'hide';
};
type Options = { decorators?: Decorators };

const buildDecoratorString = ( decorators: Decorators = {} ) => {
	const decoratorParamStrings = Object.entries( decorators ).map(
		( keyValue ) => keyValue.join( ':' )
	);
	return decoratorParamStrings.join( ';' );
};

export const gotoStoryId = (
	page: Page,
	storyId: string,
	{ decorators }: Options = {}
) => {
	const params = new URLSearchParams();
	const decoratorString = buildDecoratorString( decorators );

	if ( decoratorString ) {
		params.set( 'globals', decoratorString );
	}

	params.set( 'id', storyId );

	page.goto(
		`http://localhost:${ STORYBOOK_PORT }/iframe.html?${ params.toString() }`,
		{ waitUntil: 'load' }
	);
};
