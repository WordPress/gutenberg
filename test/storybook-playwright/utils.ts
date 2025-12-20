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
	customE2EControls?: 'show' | 'hide';
};
type Options = { decorators?: Decorators };

const buildDecoratorString = ( decorators: Decorators = {} ) => {
	const decoratorParamStrings = Object.entries( decorators ).map(
		( keyValue ) => keyValue.join( ':' )
	);
	return decoratorParamStrings.join( ';' );
};

export const gotoStoryId = async (
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

	await page.goto(
		`http://localhost:${ STORYBOOK_PORT }/iframe.html?${ params.toString() }`,
		{ waitUntil: 'load' }
	);
};

/**
 * Generate all possible permutations of those controls.
 *
 * @param propsConfig
 */
export const getAllPropsPermutations = (
	propsConfig: {
		propName: string;
		valuesToTest: any[];
	}[]
) => {
	const allPropsPermutations: Record< string, any >[] = [];

	const iterateOverNextPropValues = async (
		remainingProps: typeof propsConfig,
		accProps: Record< string, any >
	) => {
		const [ propObject, ...restProps ] = remainingProps;

		// Test all values for the given prop.
		for ( const value of propObject.valuesToTest ) {
			const valueAsString = value === undefined ? 'undefined' : value;
			const newAccProps = {
				...accProps,
				[ propObject.propName ]: valueAsString,
			};

			if ( restProps.length === 0 ) {
				// If we exhausted all of the props to set for this specific combination,
				// let's add this combination to the `allPropsPermutations` array.
				allPropsPermutations.push( newAccProps );
			} else {
				// If there are more props to iterate through, let's do that through
				// recursively calling this function.
				iterateOverNextPropValues( restProps, newAccProps );
			}
		}
	};

	// Start!
	iterateOverNextPropValues( propsConfig, {} );

	return allPropsPermutations;
};

export const testSnapshotForPropsConfig = async (
	page: Page,
	propsConfig: Record< string, any >
) => {
	const textarea = await page.getByLabel( 'Raw props', { exact: true } );
	const submitButton = await page.getByRole( 'button', {
		name: 'Set props',
		exact: true,
	} );

	await textarea.type( JSON.stringify( propsConfig ) );

	await submitButton.click();

	expect(
		await page.screenshot( { animations: 'disabled' } )
	).toMatchSnapshot();
};
