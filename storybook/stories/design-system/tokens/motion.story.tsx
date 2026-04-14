import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, SelectControl, TextControl } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { Stack } from '@wordpress/ui';

const EASING_TOKENS = [
	{
		name: 'subtle',
		variable: 'var(--wpds-motion-easing-subtle)',
		description: 'Hover, color, and background transitions.',
	},
	{
		name: 'balanced',
		variable: 'var(--wpds-motion-easing-balanced)',
		description:
			'On-screen movement like resizing, morphing, and layout shifts.',
	},
	{
		name: 'expressive',
		variable: 'var(--wpds-motion-easing-expressive)',
		description:
			'Enter/exit and spatial transitions like menus, popovers, dialogs, and drawers.',
	},
];

const DURATION_TOKENS = [
	{
		name: 'xs',
		variable: 'var(--wpds-motion-duration-xs)',
		description: 'Micro-delays and transition offsets.',
	},
	{
		name: 'sm',
		variable: 'var(--wpds-motion-duration-sm)',
		description: 'Micro-interactions like focus rings and state changes.',
	},
	{
		name: 'md',
		variable: 'var(--wpds-motion-duration-md)',
		description: 'Standard transitions like menus and popovers.',
	},
	{
		name: 'lg',
		variable: 'var(--wpds-motion-duration-lg)',
		description: 'Deliberate animations like slides and reveals.',
	},
	{
		name: 'xl',
		variable: 'var(--wpds-motion-duration-xl)',
		description:
			'Extended animations like complex or multi-step transitions.',
	},
];

const DURATION_OPTIONS = [
	{ label: 'xs', value: 'var(--wpds-motion-duration-xs)' },
	{ label: 'sm', value: 'var(--wpds-motion-duration-sm)' },
	{ label: 'md', value: 'var(--wpds-motion-duration-md)' },
	{ label: 'lg', value: 'var(--wpds-motion-duration-lg)' },
	{ label: 'xl', value: 'var(--wpds-motion-duration-xl)' },
	{ label: 'Custom', value: 'custom' },
];

const labelStyle = {
	fontFamily: 'var(--wpds-typography-font-family-mono)',
	fontSize: 'var(--wpds-typography-font-size-sm)',
	color: 'var(--wpds-color-fg-content-neutral)',
} as const;

const descriptionStyle = {
	fontFamily: 'var(--wpds-typography-font-family-body)',
	fontSize: 'var(--wpds-typography-font-size-xs)',
	color: 'var(--wpds-color-fg-content-neutral-weak)',
} as const;

const trackStyle = {
	position: 'relative',
	height: '40px',
	borderRadius: 'var(--wpds-border-radius-sm)',
	backgroundColor: 'var(--wpds-color-bg-surface-neutral-weak)',
	overflow: 'hidden',
	flex: 1,
} as const;

const dotKeyframes = `@keyframes slideRight {
	from { inset-inline-start: 4px; }
	to { inset-inline-start: calc(100% - 36px); }
}`;

const dotBaseStyle = {
	position: 'absolute',
	top: '4px',
	insetInlineStart: '4px',
	width: '32px',
	height: '32px',
	borderRadius: 'var(--wpds-border-radius-sm)',
	backgroundColor: 'var(--wpds-color-bg-interactive-brand-strong)',
	animationName: 'slideRight',
	animationFillMode: 'forwards',
} as const;

function AnimationRow( {
	label,
	description,
	duration,
	easing,
	animKey,
}: {
	label: string;
	description?: string;
	duration: string;
	easing: string;
	animKey: number;
} ) {
	return (
		<Stack align="center" gap="lg">
			<Stack
				direction="column"
				gap="xs"
				style={ { width: '320px', flexShrink: 0 } }
			>
				<span style={ labelStyle }>{ label }</span>
				{ description && (
					<span style={ descriptionStyle }>{ description }</span>
				) }
			</Stack>
			<div style={ trackStyle }>
				<div
					key={ animKey }
					style={ {
						...dotBaseStyle,
						animationDuration: duration,
						animationTimingFunction: easing,
					} }
				/>
			</div>
		</Stack>
	);
}

function MotionDemo() {
	const [ animKey, setAnimKey ] = useState( 0 );
	const replay = useCallback( () => setAnimKey( ( k ) => k + 1 ), [] );
	const [ selectedDuration, setSelectedDuration ] = useState(
		'var(--wpds-motion-duration-xl)'
	);
	const [ customDuration, setCustomDuration ] = useState( '600' );

	const easingDuration =
		selectedDuration === 'custom'
			? `${ customDuration }ms`
			: selectedDuration;

	return (
		<Stack direction="column" gap="xl">
			{ /* eslint-disable-next-line react/no-danger */ }
			<style dangerouslySetInnerHTML={ { __html: dotKeyframes } } />
			<div>
				<Button variant="secondary" onClick={ replay }>
					Replay animations
				</Button>
			</div>

			<Stack direction="column" gap="lg">
				<h3>Easing curves</h3>
				<Stack align="end" gap="md" wrap="wrap">
					<SelectControl
						__next40pxDefaultSize
						label="Duration"
						value={ selectedDuration }
						options={ DURATION_OPTIONS }
						onChange={ ( value ) => {
							setSelectedDuration( value );
							setAnimKey( ( k ) => k + 1 );
						} }
						style={ { minWidth: '180px' } }
					/>
					{ selectedDuration === 'custom' && (
						<TextControl
							__next40pxDefaultSize
							label="Value (ms)"
							type="number"
							min={ 0 }
							max={ 5000 }
							step={ 50 }
							value={ customDuration }
							onChange={ ( value ) => {
								setCustomDuration( value );
								setAnimKey( ( k ) => k + 1 );
							} }
							style={ { width: '120px' } }
						/>
					) }
				</Stack>
				<Stack direction="column" gap="md">
					{ EASING_TOKENS.map( ( token ) => (
						<AnimationRow
							key={ token.name }
							label={ token.name }
							description={ token.description }
							duration={ easingDuration }
							easing={ token.variable }
							animKey={ animKey }
						/>
					) ) }
				</Stack>
			</Stack>

			<Stack direction="column" gap="lg">
				<h3>Durations</h3>
				<p>All using easing-standard</p>
				<Stack direction="column" gap="md">
					{ DURATION_TOKENS.map( ( token ) => (
						<AnimationRow
							key={ token.name }
							label={ token.name }
							description={ token.description }
							duration={ token.variable }
							easing="var(--wpds-motion-easing-balanced)"
							animKey={ animKey }
						/>
					) ) }
				</Stack>
			</Stack>
		</Stack>
	);
}

const meta: Meta< typeof MotionDemo > = {
	title: 'Design System/Tokens/Motion',
	component: MotionDemo,
	parameters: {
		controls: { hideNoControlsWarning: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

export const Default: StoryObj< typeof MotionDemo > = {};
