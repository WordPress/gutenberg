/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Composite, useCompositeStore } from '..';
import { UseCompositeStorePlaceholder, transform } from './utils';

const meta: Meta< typeof UseCompositeStorePlaceholder > = {
	title: 'Components/Composite',
	component: UseCompositeStorePlaceholder,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Composite,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Group': Composite.Group,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.GroupLabel': Composite.GroupLabel,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Row': Composite.Row,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Composite.Item': Composite.Item,
	},
	argTypes: {
		activeId: { control: 'text' },
		defaultActiveId: { control: 'text' },
		setActiveId: { control: { type: null } },
		focusLoop: {
			control: 'select',
			options: [ true, false, 'horizontal', 'vertical', 'both' ],
		},
		focusShift: { control: 'boolean' },
		focusWrap: { control: 'boolean' },
		virtualFocus: { control: 'boolean' },
		rtl: { control: 'boolean' },
		orientation: {
			control: 'select',
			options: [ 'horizontal', 'vertical', 'both' ],
		},
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
			source: { transform },
			extractArgTypes: ( component: React.FunctionComponent ) => {
				const commonArgTypes = {
					render: {
						name: 'render',
						description:
							'Allows the component to be rendered as a different HTML element or React component. The value can be a React element or a function that takes in the original component props and gives back a React element with the props merged.',
						table: {
							type: {
								summary:
									'RenderProp<React.HTMLAttributes<any> & { ref?: React.Ref<any> | undefined; }> | React.ReactElement<any, string | React.JSXElementConstructor<any>>',
							},
						},
					},
					children: {
						name: 'children',
						description: 'The contents of the component.',
						table: { type: { summary: 'React.ReactNode' } },
					},
				};
				const argTypes = {
					useCompositeStore: {
						activeId: {
							name: 'activeId',
							description:
								'The current active item id. The active item is the element within the composite widget that has either DOM or virtual focus. `null` represents the base composite element (the one with a composite role). Users will be able to navigate out of it using arrow keys.',
							table: { type: { summary: 'string | null' } },
						},
						defaultActiveId: {
							name: 'defaultActiveId',
							description:
								'The composite item id that should be active by default when the composite widget is rendered. If `null`, the composite element itself will have focus and users will be able to navigate to it using arrow keys. If `undefined`, the first enabled item will be focused.',
							table: { type: { summary: 'string | null' } },
						},
						setActiveId: {
							name: 'setActiveId',
							description:
								'A callback that gets called when the activeId state changes.',
							table: {
								type: {
									summary:
										'((activeId: string | null | undefined) => void)',
								},
							},
						},
						focusLoop: {
							name: 'focusLoop',
							description:
								'Determines how the focus behaves when the user reaches the end of the composite widget.',
							table: {
								defaultValue: {
									summary: 'false',
								},
								type: {
									summary:
										"boolean | 'horizontal' | 'vertical' | 'both'",
								},
							},
						},
						focusShift: {
							name: 'focusShift',
							description:
								"Works only on two-dimensional composite widgets. If enabled, moving up or down when there's no next item or when the next item is disabled will shift to the item right before it.",
							table: {
								defaultValue: {
									summary: 'false',
								},
								type: {
									summary: 'boolean',
								},
							},
						},
						focusWrap: {
							name: 'focusWrap',
							description:
								'Works only on two-dimensional composite widgets. If enabled, moving to the next item from the last one in a row or column will focus on the first item in the next row or column and vice-versa.',
							table: {
								defaultValue: {
									summary: 'false',
								},
								type: {
									summary: 'boolean',
								},
							},
						},
						virtualFocus: {
							name: 'virtualFocus',
							description:
								'If enabled, the composite element will act as an aria-activedescendant⁠ container instead of roving tabindex⁠. DOM focus will remain on the composite element while its items receive virtual focus. In both scenarios, the item in focus will carry the data-active-item attribute.',
							table: {
								defaultValue: {
									summary: 'false',
								},
								type: {
									summary: 'boolean',
								},
							},
						},
						orientation: {
							name: 'orientation',
							description:
								"Defines the orientation of the composite widget. If the composite has a single row or column (one-dimensional), the orientation value determines which arrow keys can be used to move focus. It doesn't have any effect on two-dimensional composites.",
							table: {
								defaultValue: {
									summary: "'both'",
								},
								type: {
									summary:
										"'horizontal' | 'vertical' | 'both'",
								},
							},
						},
						rtl: {
							name: 'rtl',
							description:
								'Determines how the next and previous functions will behave. If rtl is set to true, they will be inverted. This only affects the composite widget behavior. You still need to set dir="rtl" on HTML/CSS.',
							table: {
								defaultValue: {
									summary: 'false',
								},
								type: {
									summary: 'boolean',
								},
							},
						},
					},
					Composite: {
						...commonArgTypes,
						store: {
							name: 'store',
							description:
								'Object returned by the `useCompositeStore` hook.',
							table: {
								type: {
									summary:
										'CompositeStore<CompositeStoreItem>',
								},
							},
							type: { required: true },
						},
					},
					'Composite.Group': commonArgTypes,
					'Composite.GroupLabel': commonArgTypes,
					'Composite.Row': commonArgTypes,
					'Composite.Item': commonArgTypes,
				};

				const name = component.displayName ?? '';

				return name in argTypes
					? argTypes[ name as keyof typeof argTypes ]
					: {};
			},
		},
	},
};
export default meta;

export const Default: StoryFn< typeof UseCompositeStorePlaceholder > = (
	storeProps
) => {
	const rtl = isRTL();
	const store = useCompositeStore( { rtl, ...storeProps } );

	return (
		<Composite store={ store }>
			<Composite.Item>Item one</Composite.Item>
			<Composite.Item>Item two</Composite.Item>
			<Composite.Item>Item three</Composite.Item>
		</Composite>
	);
};

export const Grid: StoryFn< typeof UseCompositeStorePlaceholder > = (
	storeProps
) => {
	const rtl = isRTL();
	const store = useCompositeStore( { rtl, ...storeProps } );

	return (
		<Composite role="grid" store={ store } aria-label="Composite">
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
		</Composite>
	);
};
