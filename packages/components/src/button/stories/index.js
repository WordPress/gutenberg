/**
 * External dependencies
 */
import { text, number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import './style.css';
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

export const icon = () => {
	const usedIcon = text( 'Icon', 'ellipsis' );
	const label = text( 'Label', 'More' );
	const size = number( 'Size' );

	return (
		<Button
			icon={ usedIcon }
			label={ label }
			iconSize={ size }
		/>
	);
};

export const groupedIcons = () => {
	const GroupContainer = ( { children } ) => (
		<div style={ { display: 'inline-flex' } }>{ children }</div>
	);

	return (
		<GroupContainer>
			<Button icon="editor-bold" label="Bold" />
			<Button icon="editor-italic" label="Italic" />
			<Button icon="editor-underline" label="Underline" />
		</GroupContainer>
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
				<Button isSmall icon="ellipsis" />
				<Button isSmall isPrimary icon="ellipsis" />
				<Button isSmall isSecondary icon="ellipsis" />
				<Button isSmall isTertiary icon="ellipsis" />
				<Button isSmall isPrimary icon="ellipsis">Icon & Text</Button>
			</div>

			<h2>Regular Buttons</h2>
			<div className="story-buttons-container">
				<Button>Button</Button>
				<Button isPrimary>Primary Button</Button>
				<Button isSecondary>Secondary Button</Button>
				<Button isTertiary>Tertiary Button</Button>
				<Button icon="ellipsis" />
				<Button isPrimary icon="ellipsis" />
				<Button isSecondary icon="ellipsis" />
				<Button isTertiary icon="ellipsis" />
				<Button isPrimary icon="ellipsis">Icon & Text</Button>
			</div>
		</div>
	);
};
