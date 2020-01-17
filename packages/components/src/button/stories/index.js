/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import './style.css';
import Button from '../';
import IconButton from '../../icon-button';

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

export const secondary = () => {
	const label = text( 'Label', 'Secondary Button' );

	return (
		<Button isSecondary>{ label }</Button>
	);
};

export const tertiary = () => {
	const label = text( 'Label', 'Tertiary Button' );

	return (
		<Button isTertiary>{ label }</Button>
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

export const buttons = () => {
	return (
		<div style={ { padding: '20px' } }>
			<h2>Small Buttons</h2>
			<div className="story-buttons-container">
				<Button isSmall>Button</Button>
				<Button isPrimary isSmall>Primary Button</Button>
				<Button isSecondary isSmall>Secondary Button</Button>
				<Button isTertiary isSmall>Tertiary Button</Button>
				<IconButton isSmall icon="ellipsis" />
				<IconButton isSmall isPrimary icon="ellipsis" />
				<IconButton isSmall isSecondary icon="ellipsis" />
				<IconButton isSmall isTertiary icon="ellipsis" />
				<IconButton isSmall isPrimary icon="ellipsis">Icon & Text</IconButton>
			</div>

			<h2>Regular Buttons</h2>
			<div className="story-buttons-container">
				<Button>Button</Button>
				<Button isPrimary>Primary Button</Button>
				<Button isSecondary>Secondary Button</Button>
				<Button isTertiary>Tertiary Button</Button>
				<IconButton icon="ellipsis" />
				<IconButton isPrimary icon="ellipsis" />
				<IconButton isSecondary icon="ellipsis" />
				<IconButton isTertiary icon="ellipsis" />
				<IconButton isPrimary icon="ellipsis">Icon & Text</IconButton>
			</div>
		</div>
	);
};
