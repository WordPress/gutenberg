/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Button from '../';

export default { title: 'Button', component: Button };

export const _default = () => <Button>Hello Button</Button>;

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
