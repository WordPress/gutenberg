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

	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: 24 } }>
			{ variants.map( ( variant ) => (
				<div
					style={ { display: 'flex', gap: 8 } }
					key={ variant ?? 'undefined' }
				>
					<Button { ...props } variant={ variant } />
					<Button { ...props } variant={ variant } disabled />
					<Button
						{ ...props }
						variant={ variant }
						disabled
						__experimentalIsFocusable
					/>
					<Button { ...props } variant={ variant } isBusy />
					<Button { ...props } variant={ variant } isDestructive />
					<Button { ...props } variant={ variant } isPressed />
				</div>
			) ) }
		</div>
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
