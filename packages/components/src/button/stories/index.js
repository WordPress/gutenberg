/**
 * External dependencies
 */
import { text, boolean, number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import './style.css';
import Button from '../';

export default { title: 'Components|Button', component: Button };

function getOptions( defaultLabel = 'Button' ) {
	const label = text( 'Label', defaultLabel );
	const disabled = boolean( 'Disabled', false );
	const isFocusable = disabled && boolean( 'isFocusable', false );
	return { label, disabled, isFocusable };
}

export const _default = () => {
	const { label, ...props } = getOptions( 'Default Button' );

	return <Button { ...props }>{ label }</Button>;
};

export const primary = () => {
	const { label, ...props } = getOptions( 'Primary Button' );

	return (
		<Button isPrimary { ...props }>
			{ label }
		</Button>
	);
};

export const secondary = () => {
	const { label, ...props } = getOptions( 'Secondary Button' );

	return (
		<Button isSecondary { ...props }>
			{ label }
		</Button>
	);
};

export const tertiary = () => {
	const { label, ...props } = getOptions( 'Tertiary Button' );

	return (
		<Button isTertiary { ...props }>
			{ label }
		</Button>
	);
};

export const small = () => {
	const { label, ...props } = getOptions( 'Small Button' );

	return (
		<Button isSmall { ...props }>
			{ label }
		</Button>
	);
};

export const pressed = () => {
	const { label, ...props } = getOptions( 'Pressed Button' );

	return (
		<Button isPressed { ...props }>
			{ label }
		</Button>
	);
};

export const link = () => {
	const { label, ...props } = getOptions( 'Link Button' );

	return (
		<Button href="https://wordpress.org/" target="_blank" { ...props }>
			{ label }
		</Button>
	);
};

export const icon = () => {
	const usedIcon = text( 'Icon', 'ellipsis' );
	const size = number( 'Size' );
	const { label, ...props } = getOptions( 'More' );

	return (
		<Button
			icon={ usedIcon }
			label={ label }
			iconSize={ size }
			{ ...props }
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
