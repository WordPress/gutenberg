/**
 * External dependencies
 */
import { text, number, boolean } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import {
	formatBold,
	formatItalic,
	link as linkIcon,
	more,
	wordpress,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.css';
import Button from '../';

export default {
	title: 'Components/Button',
	component: Button,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const label = text( 'Label', 'Default Button' );

	return <Button>{ label }</Button>;
};

export const primary = () => {
	const label = text( 'Label', 'Primary Button' );

	return <Button variant="primary">{ label }</Button>;
};

export const secondary = () => {
	const label = text( 'Label', 'Secondary Button' );

	return <Button variant="secondary">{ label }</Button>;
};

export const tertiary = () => {
	const label = text( 'Label', 'Tertiary Button' );

	return <Button variant="tertiary">{ label }</Button>;
};

export const isDestructive = () => {
	const label = text( 'Label', 'Destructive Button' );
	const isSmall = boolean( 'isSmall', false );
	const disabled = boolean( 'disabled', false );

	return (
		<Button isDestructive isSmall={ isSmall } disabled={ disabled }>
			{ label }
		</Button>
	);
};

export const isPrimaryDestructive = () => {
	const label = text( 'Label', 'Destructive Primary Button' );
	const isSmall = boolean( 'isSmall', false );
	const disabled = boolean( 'disabled', false );

	return (
		<Button
			variant="primary"
			isDestructive
			isSmall={ isSmall }
			disabled={ disabled }
		>
			{ label }
		</Button>
	);
};

export const small = () => {
	const label = text( 'Label', 'Small Button' );

	return <Button isSmall>{ label }</Button>;
};

export const pressed = () => {
	const label = text( 'Label', 'Pressed Button' );

	return <Button isPressed>{ label }</Button>;
};

export const disabled = () => {
	const label = text( 'Label', 'Disabled Button' );

	return <Button disabled>{ label }</Button>;
};

export const disabledFocusable = () => {
	const label = text( 'Label', 'Disabled Button' );

	return (
		<Button disabled __experimentalIsFocusable>
			{ label }
		</Button>
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

export const destructiveLink = () => {
	const label = text( 'Label', 'Destructive Link' );

	return (
		<Button isDestructive variant="link">
			{ label }
		</Button>
	);
};

export const icon = () => {
	const label = text( 'Label', 'Code is poetry' );
	const size = number( 'Size', 24 );

	return <Button icon={ wordpress } label={ label } iconSize={ size } />;
};

export const disabledFocusableIcon = () => {
	const label = text( 'Label', 'Code is poetry' );
	const size = number( 'Size', 24 );

	return (
		<Button
			icon={ wordpress }
			label={ label }
			iconSize={ size }
			disabled
			__experimentalIsFocusable
		/>
	);
};

export const groupedIcons = () => {
	const GroupContainer = ( { children } ) => (
		<div style={ { display: 'inline-flex' } }>{ children }</div>
	);

	return (
		<GroupContainer>
			<Button icon={ formatBold } label="Bold" />
			<Button icon={ formatItalic } label="Italic" />
			<Button icon={ linkIcon } label="Link" />
		</GroupContainer>
	);
};

export const buttons = () => {
	return (
		<div style={ { padding: '20px' } }>
			<h2>Small Buttons</h2>
			<div className="story-buttons-container">
				<Button isSmall>Button</Button>
				<Button variant="primary" isSmall>
					Primary Button
				</Button>
				<Button variant="secondary" isSmall>
					Secondary Button
				</Button>
				<Button variant="tertiary" isSmall>
					Tertiary Button
				</Button>
				<Button isSmall icon={ more } />
				<Button isSmall variant="primary" icon={ more } />
				<Button isSmall variant="secondary" icon={ more } />
				<Button isSmall variant="tertiary" icon={ more } />
				<Button isSmall variant="primary" icon={ more }>
					Icon & Text
				</Button>
			</div>

			<h2>Regular Buttons</h2>
			<div className="story-buttons-container">
				<Button>Button</Button>
				<Button variant="primary">Primary Button</Button>
				<Button variant="secondary">Secondary Button</Button>
				<Button variant="tertiary">Tertiary Button</Button>
				<Button icon={ more } />
				<Button variant="primary" icon={ more } />
				<Button variant="secondary" icon={ more } />
				<Button variant="tertiary" icon={ more } />
				<Button variant="primary" icon={ more }>
					Icon & Text
				</Button>
			</div>
		</div>
	);
};
