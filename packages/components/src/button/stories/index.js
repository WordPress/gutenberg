/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Button from '../';

export default { title: 'Button', component: Button };

export const _default = () => {
	const label = text( 'Label', 'Hello Button' );

	return (
		<Button>{ label }</Button>
	);
};

export const primary = () => <Button isPrimary>Hello Button</Button>;

export const large = () => <Button isLarge>Hello Button</Button>;

export const largePrimary = () => (
	<Button isPrimary isLarge>
		Hello Button
	</Button>
);

export const small = () => <Button isSmall>Hello Button</Button>;

export const toggled = () => <Button isToggled>Hello Button</Button>;

export const disabled = () => <Button disabled>Hello Button</Button>;

export const link = () => (
	<Button href="https://wordpress.org/" target="_blank">
		Hello Button
	</Button>
);

export const disabledLink = () => (
	<Button href="https://wordpress.org/" target="_blank" disabled>
		Hello Button
	</Button>
);
