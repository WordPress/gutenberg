/**
 * External dependencies
 */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

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

/**
 * Parses the Story, looking for e2e tests-specific controls, and generates
 * snapshots for all possible combinations of these controls.
 *
 * @param page
 */
export const testAllSnapshotsCombinationsWithE2EControls = async (
	page: Page
) => {
	type PropsObject = { name: string; values: string[] };

	// Collect all available configurations.
	const allProps: PropsObject[] = [];

	// Scan all `role=group` elements containing text "prop controls"
	for ( const group of await page
		.getByRole( 'group' )
		.filter( { hasText: 'prop controls' } )
		.all() ) {
		// Get the text content
		const title = await group.textContent();
		if ( title === null ) {
			continue;
		}

		// Use a RegExp to extract the prop name —
		// it's expected to be the first word, before "prop controls"
		const results = /(?<propName>^\w+) prop controls/g.exec( title );
		if ( results === null || ! results.groups?.propName ) {
			continue;
		}

		const propObject: PropsObject = {
			name: results.groups?.propName,
			values: [],
		};

		// Once the prop name is extracted, scan all buttons inside the group,
		// and extract the label.
		for ( const button of await group.getByRole( 'button' ).all() ) {
			const buttonLabel = await button.textContent();
			if ( buttonLabel !== null ) {
				propObject.values.push( buttonLabel );
			}
		}
		allProps.push( propObject );
	}

	// Test all possible configurations
	const iterateOverNextPropValues = async (
		remainingProps: PropsObject[]
	) => {
		const [ propObject, ...restProps ] = remainingProps;

		// Test all values for the given prop.
		for ( const value of propObject.values ) {
			// Find the button corresponding to the current value
			const button = await page
				.getByRole( 'group' )
				.filter( {
					hasText: `${ propObject.name } prop controls`,
				} )
				.getByRole( 'button', { name: value, exact: true } );

			// Click the button. This will set the corresponding prop in the story.
			await button.click();

			if ( restProps.length === 0 ) {
				// If we exhausted all of the props to set for this specific combination,
				// it's time to take a screenshot of this specific combination of props.
				expect( await page.screenshot() ).toMatchSnapshot();
			} else {
				// IF there are more props to iterate through, let's do that through
				// recursively calling this function.
				await iterateOverNextPropValues( restProps );
			}
		}
	};

	// Start!
	await iterateOverNextPropValues( allProps );
};
