import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, SelectControl, TextControl } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { Stack } from '@wordpress/ui';

import styles from './motion.story.module.css';

const EASING_TOKENS = [
	{
		name: 'standard',
		variable: 'var(--wpds-motion-easing-standard)',
		description: 'State changes like hover, color, and toggle transitions.',
	},
	{
		name: 'decelerate',
		variable: 'var(--wpds-motion-easing-decelerate)',
		description:
			'Elements entering the screen, such as menus and popovers.',
	},
	{
		name: 'emphasized-decelerate',
		variable: 'var(--wpds-motion-easing-emphasized-decelerate)',
		description: 'Prominent entrances like dialogs and drawers.',
	},
	{
		name: 'accelerate',
		variable: 'var(--wpds-motion-easing-accelerate)',
		description: 'Elements leaving the screen.',
	},
	{
		name: 'emphasized-accelerate',
		variable: 'var(--wpds-motion-easing-emphasized-accelerate)',
		description: 'Prominent exits like dialogs and drawers.',
	},
];

const DURATION_TOKENS = [
	{
		name: 'xs (50ms)',
		variable: 'var(--wpds-motion-duration-xs)',
		description: 'Micro-delays and transition offsets.',
	},
	{
		name: 'sm (100ms)',
		variable: 'var(--wpds-motion-duration-sm)',
		description: 'Micro-interactions like focus rings and state changes.',
	},
	{
		name: 'md (200ms)',
		variable: 'var(--wpds-motion-duration-md)',
		description: 'Standard transitions like menus and popovers.',
	},
	{
		name: 'lg (300ms)',
		variable: 'var(--wpds-motion-duration-lg)',
		description: 'Deliberate animations like slides and reveals.',
	},
	{
		name: 'xl (400ms)',
		variable: 'var(--wpds-motion-duration-xl)',
		description:
			'Extended animations like complex or multi-step transitions.',
	},
];

const DURATION_OPTIONS = [
	{ label: 'xs (50ms)', value: '50ms' },
	{ label: 'sm (100ms)', value: '100ms' },
	{ label: 'md (200ms)', value: '200ms' },
	{ label: 'lg (300ms)', value: '300ms' },
	{ label: 'xl (400ms)', value: '400ms' },
	{ label: 'Custom', value: 'custom' },
];

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
				<span className={ styles.label }>{ label }</span>
				{ description && (
					<span className={ styles.description }>
						{ description }
					</span>
				) }
			</Stack>
			<div className={ styles.track }>
				<div
					key={ animKey }
					className={ styles.dot }
					style={ {
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
	const [ selectedDuration, setSelectedDuration ] = useState( '400ms' );
	const [ customDuration, setCustomDuration ] = useState( '600' );

	const easingDuration =
		selectedDuration === 'custom'
			? `${ customDuration }ms`
			: selectedDuration;

	return (
		<Stack direction="column" gap="xl">
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
							easing="var(--wpds-motion-easing-standard)"
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
