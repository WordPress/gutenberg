/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { createSlotFill, Provider as SlotFillProvider } from '../../slot-fill';
import { Composite } from '..';
import { Tooltip } from '../../tooltip';

const meta: Meta< typeof Composite > = {
	title: 'Components/Utilities/Composite',
	id: 'components-composite',
	component: Composite,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Group': Composite.Group,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.GroupLabel': Composite.GroupLabel,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Row': Composite.Row,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Item': Composite.Item,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Hover': Composite.Hover,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Typeahead': Composite.Typeahead,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Context': Composite.Context,
	},
	argTypes: {
		children: { control: false },
		render: { control: false },
		setActiveId: { control: false },
		focusLoop: {
			control: 'select',
			options: [ true, false, 'horizontal', 'vertical', 'both' ],
		},
		focusWrap: {
			control: 'select',
			options: [ true, false, 'horizontal', 'vertical', 'both' ],
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
		},
	},
	decorators: [
		( Story ) => {
			return (
				<>
					{ /* Visually style the active composite item  */ }
					<style>{ `
						[data-active-item] {
							background-color: #ffc0b5;
						}
					` }</style>
					<Story />
					<div
						style={ {
							marginTop: '2em',
							fontSize: '12px',
							fontStyle: 'italic',
						} }
					>
						{ /* eslint-disable-next-line no-restricted-syntax */ }
						<p id="list-title">Notes</p>
						<ul aria-labelledby="list-title">
							<li>
								The active composite item is highlighted with a
								different background color;
							</li>
							<li>
								A composite item can be the active item even
								when it doesn&apos;t have keyboard focus.
							</li>
						</ul>
					</div>
				</>
			);
		},
	],
};
export default meta;

export const Default: StoryObj< typeof Composite > = {
	args: {
		children: (
			<>
				<Composite.Item>Item one</Composite.Item>
				<Composite.Item>Item two</Composite.Item>
				<Composite.Item>Item three</Composite.Item>
			</>
		),
	},
};

export const Groups: StoryObj< typeof Composite > = {
	...Default,
	args: {
		...Default.args,
		children: (
			<>
				<Composite.Group>
					<Composite.GroupLabel>Group one</Composite.GroupLabel>
					<Composite.Item>Item 1.1</Composite.Item>
					<Composite.Item>Item 1.2</Composite.Item>
				</Composite.Group>
				<Composite.Group>
					<Composite.GroupLabel>Group two</Composite.GroupLabel>
					<Composite.Item>Item 2.1</Composite.Item>
					<Composite.Item>Item 2.1</Composite.Item>
				</Composite.Group>
			</>
		),
	},
};

export const Grid: StoryObj< typeof Composite > = {
	...Default,
	args: {
		...Default.args,
		role: 'grid',
		'aria-label': 'Composite',
		children: (
			<>
				<Composite.Row role="row">
					<Composite.Item role="gridcell">Item A1</Composite.Item>
					<Composite.Item role="gridcell">Item A2</Composite.Item>
					<Composite.Item role="gridcell">Item A3</Composite.Item>
				</Composite.Row>
				<Composite.Row role="row">
					<Composite.Item role="gridcell">Item B1</Composite.Item>
					<Composite.Item role="gridcell">Item B2</Composite.Item>
					<Composite.Item role="gridcell">Item B3</Composite.Item>
				</Composite.Row>
				<Composite.Row role="row">
					<Composite.Item role="gridcell">Item C1</Composite.Item>
					<Composite.Item role="gridcell">Item C2</Composite.Item>
					<Composite.Item role="gridcell">Item C3</Composite.Item>
				</Composite.Row>
			</>
		),
	},
};

export const Hover: StoryObj< typeof Composite > = {
	...Default,
	args: {
		...Default.args,
		children: (
			<>
				<Composite.Hover render={ <Composite.Item /> }>
					Hover item one
				</Composite.Hover>
				<Composite.Hover render={ <Composite.Item /> }>
					Hover item two
				</Composite.Hover>
				<Composite.Hover render={ <Composite.Item /> }>
					Hover item three
				</Composite.Hover>
			</>
		),
	},
	parameters: {
		docs: {
			description: {
				story: 'Elements in the composite widget will receive focus on mouse move and lose focus to the composite base element on mouse leave.',
			},
		},
	},
};

export const Typeahead: StoryObj< typeof Composite > = {
	args: {
		...Default.args,
		render: <Composite.Typeahead />,
		children: (
			<>
				<Composite.Item>Apple</Composite.Item>
				<Composite.Item>Banana</Composite.Item>
				<Composite.Item>Peach</Composite.Item>
			</>
		),
	},
	parameters: {
		docs: {
			description: {
				story: 'When focus in on the composite widget, hitting printable character keys will move focus to the next composite item that begins with the input characters.',
			},
		},
	},
};

const ExampleSlotFill = createSlotFill( 'Example' );

const Slot = () => {
	const compositeContext = useContext( Composite.Context );

	// Forward the Slot's composite context to the Fill via fillProps, so that
	// Composite components rendered inside the Fill can work as expected.
	const fillProps = useMemo(
		() => ( {
			forwardedContext: [
				[ Composite.Context.Provider, { value: compositeContext } ],
			],
		} ),
		[ compositeContext ]
	);

	return (
		<ExampleSlotFill.Slot
			fillProps={ fillProps }
			bubblesVirtually
			style={ { display: 'contents' } }
		/>
	);
};

type ForwardedContextTuple< P = {} > = [
	React.ComponentType< React.PropsWithChildren< P > >,
	P,
];

const Fill = ( { children }: { children: React.ReactNode } ) => {
	const innerMarkup = <>{ children }</>;

	return (
		<ExampleSlotFill.Fill>
			{ ( fillProps: { forwardedContext?: ForwardedContextTuple[] } ) => {
				const { forwardedContext = [] } = fillProps;

				// Render all context providers forwarded by the Slot via fillProps.
				return forwardedContext.reduce(
					( inner: JSX.Element, [ Provider, props ] ) => (
						<Provider { ...props }>{ inner }</Provider>
					),
					innerMarkup
				);
			} }
		</ExampleSlotFill.Fill>
	);
};

export const WithSlotFill: StoryObj< typeof Composite > = {
	...Default,
	args: {
		...Default.args,
		children: (
			<>
				<Composite.Item>Item one (direct child)</Composite.Item>
				<Slot />
				<Composite.Item>Item four (direct child)</Composite.Item>
			</>
		),
	},
	decorators: [
		( Story ) => {
			return (
				<SlotFillProvider>
					<Story />

					<Fill>
						<Composite.Item>
							Item two (from slot fill)
						</Composite.Item>
						<Composite.Item>
							Item three (from slot fill)
						</Composite.Item>
					</Fill>
				</SlotFillProvider>
			);
		},
	],
	parameters: {
		docs: {
			description: {
				story: 'When rendering Composite components across a SlotFill, the Composite.Context should be manually forwarded from the Slot to the Fill component.',
			},
			source: {
				transform: ( code: string ) => {
					return `const ExampleSlotFill = createSlotFill( 'Example' );

const Slot = () => {
  const compositeContext = useContext( Composite.Context );

  // Forward the Slot's composite context to the Fill via fillProps, so that
  // Composite components rendered inside the Fill can work as expected.
  const fillProps = useMemo(
    () => ( {
      forwardedContext: [
        [ Composite.Context.Provider, { value: compositeContext } ],
      ],
    } ),
    [ compositeContext ]
  );

  return (
    <ExampleSlotFill.Slot
      fillProps={ fillProps }
      bubblesVirtually
      style={ { display: 'contents' } }
    />
  );
};

const Fill = ( { children } ) => {
  const innerMarkup = <>{ children }</>;

  return (
    <ExampleSlotFill.Fill>
      { ( fillProps ) => {
        const { forwardedContext = [] } = fillProps;

        // Render all context providers forwarded by the Slot via fillProps.
        return forwardedContext.reduce(
          ( inner, [ Provider, props ] ) => (
            <Provider { ...props }>{ inner }</Provider>
          ),
          innerMarkup
        );
      } }
    </ExampleSlotFill.Fill>
  );
};

// In a separate component:

<SlotFillProvider>
  ${
		// Add one level of indentation to match the surrounding code.
		code.replaceAll( '\n', '\n  ' )
  }

  <Fill>
    <Composite.Item>
      Item two (from slot fill)
    </Composite.Item>
    <Composite.Item>
      Item three (from slot fill)
    </Composite.Item>
  </Fill>
</SlotFillProvider>`;
				},
			},
		},
	},
};

/**
 * Combining the `Tooltip` and `Composite` component has a few caveats. And while there are a few ways to compose these two components, our recommendation is to render `Composite.Item` as a child of `Tooltip`.
 *
 * ```jsx
 * // 🔴 Does not work
 * <Composite.Item
 *   render={
 *     <Tooltip text="Tooltip">
 *       <button>Item</button>
 *     </Tooltip>
 *   }
 * />
 *
 * // 🟢 Good
 * <Tooltip text="Tooltip one">
 *   <Composite.Item>
 *     Item one
 *   </Composite.Item>
 * </Tooltip>
 * ```
 */
export const WithTooltips: StoryObj< typeof Composite > = {
	...Default,
	args: {
		...Default.args,
		children: (
			<>
				<Tooltip text="Tooltip one">
					<Composite.Item>Item one</Composite.Item>
				</Tooltip>
				<Tooltip text="Tooltip two">
					<Composite.Item>Item two</Composite.Item>
				</Tooltip>
				<Tooltip text="Tooltip three">
					<Composite.Item>Item three</Composite.Item>
				</Tooltip>
			</>
		),
	},
};
