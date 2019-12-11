/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Button from '../';

export default { title: 'Components|Button', component: Button };

export const _default = () => {
	const label = text( 'Label', 'Default Button' );

	return (
		<Button>{ label }</Button>
	);
};

export const primary = () => {
	const label = text( 'Label', 'Primary Button' );

	return (
		<Button isPrimary>{ label }</Button>
	);
};

export const large = () => {
	const label = text( 'Label', 'Large Button' );

	return (
		<Button isLarge>{ label }</Button>
	);
};

export const largePrimary = () => {
	const label = text( 'Label', 'Large Primary Button' );

	return (
		<Button isPrimary isLarge>{ label }</Button>
	);
};

export const small = () => {
	const label = text( 'Label', 'Small Button' );

	return (
		<Button isSmall>{ label }</Button>
	);
};

export const pressed = () => {
	const label = text( 'Label', 'Pressed Button' );

	return (
		<Button isPressed>{ label }</Button>
	);
};

export const disabled = () => {
	const label = text( 'Label', 'Disabled Button' );

	return (
		<Button disabled>{ label }</Button>
	);
};

export const link = () => {
	const label = text( 'Label', 'Link Button' );

	return (
		<Button href="https://wordpress.org/" target="_blank">
			{ label }
		</Button>
	);
};

export const disabledLink = () => {
	const label = text( 'Label', 'Disabled Link Button' );

	return (
		<Button href="https://wordpress.org/" target="_blank" disabled>
			{ label }
		</Button>
	);
};
