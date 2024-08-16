/**
 * External dependencies
 */
import type { StoryFn, Meta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button } from '../..';
import type { ButtonAsButtonProps } from '../../types';

const meta: Meta< typeof Button > = {
	component: Button,
	title: 'Components/Button',
};
export default meta;

export const VariantStates: StoryFn< typeof Button > = (
	props: ButtonAsButtonProps
) => {
	const variants: ( typeof props.variant )[] = [
		undefined,
		'primary',
		'secondary',
		'tertiary',
		'link',
	];

	const VariantsRow = ( {
		buttonProps,
		name,
	}: {
		buttonProps?: ButtonAsButtonProps;
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
					<td key={ variant ?? 'undefined' } style={ { padding: 4 } }>
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
						<th
							key={ variant ?? 'undefined' }
							style={ { padding: 8 } }
						>
							{ variant ?? '(default)' }
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
					name="focusable disabled"
					buttonProps={ {
						accessibleWhenDisabled: true,
						disabled: true,
					} }
				/>
				<VariantsRow
					name="isBusy"
					buttonProps={ {
						isBusy: true,
					} }
				/>
				<VariantsRow
					name="isBusy disabled"
					buttonProps={ {
						isBusy: true,
						accessibleWhenDisabled: true,
						disabled: true,
					} }
				/>
				<VariantsRow
					name="isDestructive"
					buttonProps={ {
						isDestructive: true,
					} }
				/>
				<VariantsRow
					name="isDestructive disabled"
					buttonProps={ {
						isDestructive: true,
						accessibleWhenDisabled: true,
						disabled: true,
					} }
				/>
				<VariantsRow
					name="isPressed"
					buttonProps={ {
						isPressed: true,
					} }
				/>
				<VariantsRow
					name="isPressed disabled"
					buttonProps={ {
						isPressed: true,
						accessibleWhenDisabled: true,
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

export const Icon = VariantStates.bind( {} );
Icon.args = {
	icon: wordpress,
};

export const Dashicons: StoryFn< typeof Button > = ( props ) => {
	return (
		<div style={ { display: 'flex', gap: 8 } }>
			<Button { ...props } />
			<Button { ...props }>Children</Button>
			<Button { ...props } iconPosition="right">
				Children (icon right)
			</Button>
			<Button { ...props } text="Text" />
			<Button
				{ ...props }
				text="Text (icon right)"
				iconPosition="right"
			/>
		</div>
	);
};
Dashicons.args = {
	icon: 'editor-help',
	variant: 'primary',
};
