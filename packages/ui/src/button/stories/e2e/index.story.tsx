import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import { Button } from '../..';
import type { ButtonProps } from '../../types';

const meta: Meta< typeof Button > = {
	title: 'Design System/Components/Button',
	component: Button,
};
export default meta;

type Story = StoryObj< typeof Button >;

const variants: NonNullable< ButtonProps[ 'variant' ] >[] = [
	'solid',
	'outline',
	'minimal',
	'unstyled',
];

export const VariantStates: StoryFn< typeof Button > = (
	props: ButtonProps
) => {
	const VariantsRow = ( {
		buttonProps,
		name,
	}: {
		buttonProps?: ButtonProps;
		name: string;
	} ) => {
		return (
			<tr>
				<th
					style={ {
						fontSize: 13,
						fontWeight: 'normal',
						padding: 8,
						background: '#f3f4f5',
					} }
				>
					{ name }
				</th>
				{ variants.map( ( variant ) => (
					<td key={ variant } style={ { padding: 4 } }>
						<Button
							{ ...props }
							variant={ variant }
							{ ...buttonProps }
						/>
					</td>
				) ) }
			</tr>
		);
	};

	return (
		<table>
			<thead>
				<tr style={ { background: '#f3f4f5' } }>
					<th />
					{ variants.map( ( variant ) => (
						<th key={ variant } style={ { padding: 8 } }>
							{ variant }
						</th>
					) ) }
				</tr>
			</thead>
			<tbody>
				<VariantsRow name="(default)" />
				<VariantsRow
					name="disabled"
					buttonProps={ { disabled: true } }
				/>
				<VariantsRow
					name="disabled unfocusable"
					buttonProps={ {
						focusableWhenDisabled: false,
						disabled: true,
					} }
				/>
				<VariantsRow
					name="loading"
					buttonProps={ {
						loading: true,
					} }
				/>
				<VariantsRow
					name="loading disabled"
					buttonProps={ {
						loading: true,
						disabled: true,
					} }
				/>
				<VariantsRow
					name="neutral"
					buttonProps={ {
						tone: 'neutral',
					} }
				/>
				<VariantsRow
					name="pressed"
					buttonProps={ {
						tone: 'neutral',
						'aria-pressed': true,
					} }
				/>
				<VariantsRow
					name="pressed disabled"
					buttonProps={ {
						tone: 'neutral',
						'aria-pressed': true,
						disabled: true,
					} }
				/>
			</tbody>
		</table>
	);
};
VariantStates.args = {
	children: 'Code is poetry',
};

export const TextOverflow: Story = {
	args: {
		children:
			'This is an extremely long label thatshoulddemonstratetextoverflow behavior',
	},
	parameters: {
		textOverflowContainers: true,
	},
};
