/**
 * External dependencies
 */
import type { Meta, StoryFn, StoryContext } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Composite,
	CompositeItem,
	CompositeGroup,
	useCompositeState,
} from '../legacy';

import type { InitialState } from '../legacy';

const Placeholder = ( _: InitialState ) => <></>;

const transform = ( code: string, context: StoryContext ) => {
	const config = ` ${ JSON.stringify( context.args, null, 2 ) } `;
	const state = config.replace( ' {} ', '' );
	return [
		`const state = useCompositeState(${ state });`,
		'',
		'return (',
		'  ' +
			code
				.replaceAll( /state=\{\{[\s\S]*?\}\}/g, 'state={ state }' )
				.replaceAll( '=>', '' )
				.replaceAll( /baseId=[^>]+?(\s*>)/g, ( _, close ) => {
					return `{ ...state }${ close }`;
				} )
				.replaceAll( /<Composite\w+[\s\S]*?>/g, ( match ) =>
					match.replaceAll( /\s+\s/g, ' ' )
				)
				.replaceAll(
					/ >\s+([\w\s]*?)\s+<\//g,
					( _, value ) => `>${ value }</`
				)
				.replaceAll( '} >', '}>' )
				.replaceAll( /\n/g, '\n  ' ),
		');',
	].join( '\n' );
};

const meta: Meta< typeof Placeholder > = {
	title: 'Components/Composite/Composite (Legacy)',
	id: 'components-composite-legacy',
	component: Placeholder,
	args: {
		rtl: isRTL() || undefined,
	},
	argTypes: {
		baseId: {
			description: 'ID that will serve as a base for all the items IDs.',
			table: { type: { summary: 'string' } },
		},
		currentId: {
			description: 'The current focused item `id`.',
			table: { type: { summary: 'string' } },
		},
		rtl: {
			description:
				'Determines how next and previous functions will behave. If `rtl` is set to `true`, they will be inverted. This only affects the composite widget behavior. You still need to set `dir="rtl"` on HTML/CSS.',
			type: 'boolean',
			control: 'select',
			options: [ true, false ],
			table: {
				defaultValue: { summary: 'false' },
				type: { summary: 'boolean' },
			},
		},
		orientation: {
			description:
				'Defines the orientation of the composite widget. If the composite has a single row or column (one-dimensional), the orientation value determines which arrow keys can be used to move focus.',
			type: {
				name: 'enum',
				value: [ 'horizontal', 'vertical' ],
			},
			control: 'select',
			options: [ undefined, 'horizontal', 'vertical' ],
			table: {
				defaultValue: { summary: 'undefined' },
				type: {
					summary: 'undefined | "horizontal" | "vertical"',
				},
			},
		},
		loop: {
			description:
				'Determines how focus moves from the start and end of rows and columns.',
			control: 'select',
			options: [ true, false, 'horizontal', 'vertical' ],
			table: {
				defaultValue: { summary: 'false' },
				type: {
					summary: 'boolean | "horizontal" | "vertical"',
				},
			},
		},
		shift: {
			description:
				"**Has effect only on two-dimensional composites.** If enabled, moving up or down when there's no next item or the next item is disabled will shift to the item right before it.",
			type: 'boolean',
			control: 'select',
			options: [ true, false ],
			table: {
				defaultValue: { summary: 'false' },
				type: { summary: 'boolean' },
			},
		},
		wrap: {
			description:
				'**Has effect only on two-dimensional composites.** If enabled, moving to the next item from the last one in a row or column will focus the first item in the next row or column and vice-versa.',
			control: 'select',
			options: [ true, false, 'horizontal', 'vertical' ],
			table: {
				defaultValue: { summary: 'false' },
				type: {
					summary: 'boolean | "horizontal" | "vertical"',
				},
			},
		},
	},
};
export default meta;

export const TwoDimensionsWithStateProp: StoryFn< typeof Placeholder > = (
	initialState
) => {
	const state = useCompositeState( initialState );

	return (
		<Composite
			state={ state }
			aria-label="Legacy Composite with state prop (two dimensions)"
		>
			<CompositeGroup state={ state } role="row">
				<CompositeItem state={ state }>Item A1</CompositeItem>
				<CompositeItem state={ state }>Item A2</CompositeItem>
				<CompositeItem state={ state }>Item A3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup state={ state } role="row">
				<CompositeItem state={ state }>Item B1</CompositeItem>
				<CompositeItem state={ state }>Item B2</CompositeItem>
				<CompositeItem state={ state }>Item B3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup state={ state } role="row">
				<CompositeItem state={ state }>Item C1</CompositeItem>
				<CompositeItem state={ state }>Item C2</CompositeItem>
				<CompositeItem state={ state }>Item C3</CompositeItem>
			</CompositeGroup>
		</Composite>
	);
};
TwoDimensionsWithStateProp.args = {};
TwoDimensionsWithStateProp.parameters = {
	docs: { source: { transform } },
};

export const TwoDimensionsWithSpreadProps: StoryFn< typeof Placeholder > = (
	initialState
) => {
	const state = useCompositeState( initialState );

	return (
		<Composite
			{ ...state }
			aria-label="Legacy Composite with spread props (two dimensions)"
		>
			<CompositeGroup { ...state } role="row">
				<CompositeItem { ...state }>Item A1</CompositeItem>
				<CompositeItem { ...state }>Item A2</CompositeItem>
				<CompositeItem { ...state }>Item A3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup { ...state } role="row">
				<CompositeItem { ...state }>Item B1</CompositeItem>
				<CompositeItem { ...state }>Item B2</CompositeItem>
				<CompositeItem { ...state }>Item B3</CompositeItem>
			</CompositeGroup>
			<CompositeGroup { ...state } role="row">
				<CompositeItem { ...state }>Item C1</CompositeItem>
				<CompositeItem { ...state }>Item C2</CompositeItem>
				<CompositeItem { ...state }>Item C3</CompositeItem>
			</CompositeGroup>
		</Composite>
	);
};
TwoDimensionsWithSpreadProps.args = {};
TwoDimensionsWithSpreadProps.parameters = {
	docs: { source: { transform } },
};

export const OneDimensionWithStateProp: StoryFn< typeof Placeholder > = (
	initialState
) => {
	const state = useCompositeState( initialState );

	return (
		<Composite
			state={ state }
			aria-label="Legacy Composite with state prop (one dimension)"
		>
			<CompositeItem state={ state }>Item 1</CompositeItem>
			<CompositeItem state={ state }>Item 2</CompositeItem>
			<CompositeItem state={ state }>Item 3</CompositeItem>
			<CompositeItem state={ state }>Item 4</CompositeItem>
			<CompositeItem state={ state }>Item 5</CompositeItem>
		</Composite>
	);
};
OneDimensionWithStateProp.args = {};
OneDimensionWithStateProp.parameters = {
	docs: { source: { transform } },
};

export const OneDimensionWithSpreadProps: StoryFn< typeof Placeholder > = (
	initialState
) => {
	const state = useCompositeState( initialState );

	return (
		<Composite
			{ ...state }
			aria-label="Legacy Composite with spread props (one dimension)"
		>
			<CompositeItem { ...state }>Item 1</CompositeItem>
			<CompositeItem { ...state }>Item 2</CompositeItem>
			<CompositeItem { ...state }>Item 3</CompositeItem>
			<CompositeItem { ...state }>Item 4</CompositeItem>
			<CompositeItem { ...state }>Item 5</CompositeItem>
		</Composite>
	);
};
OneDimensionWithSpreadProps.args = {};
OneDimensionWithSpreadProps.parameters = {
	docs: { source: { transform } },
};
