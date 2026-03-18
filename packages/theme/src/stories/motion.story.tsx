/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useId } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ThemeProvider } from '../theme-provider';
import styles from './motion.story.module.css';

const meta: Meta< typeof ThemeProvider > = {
	title: 'Design System/Theme/Motion Tokens',
	component: ThemeProvider,
	args: {
		isRoot: true,
	},
	argTypes: {
		children: { table: { disable: true } },
		isRoot: { table: { disable: true } },
		color: { table: { disable: true } },
		density: { table: { disable: true } },
	},
	parameters: {
		controls: { hideNoControlsWarning: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

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
		<div className={ styles.row }>
			<div className={ styles.labelGroup }>
				<span className={ styles.label }>{ label }</span>
				{ description && (
					<span className={ styles.description }>
						{ description }
					</span>
				) }
			</div>
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
		</div>
	);
}

const DURATION_OPTIONS = [
	{ label: 'xs (50ms)', value: '50ms' },
	{ label: 'sm (100ms)', value: '100ms' },
	{ label: 'md (200ms)', value: '200ms' },
	{ label: 'lg (300ms)', value: '300ms' },
	{ label: 'xl (400ms)', value: '400ms' },
	{ label: 'Custom', value: 'custom' },
];

function MotionDemo() {
	const [ animKey, setAnimKey ] = useState( 0 );
	const replay = useCallback( () => setAnimKey( ( k ) => k + 1 ), [] );
	const [ selectedDuration, setSelectedDuration ] = useState( '400ms' );
	const [ customDuration, setCustomDuration ] = useState( '600' );
	const selectId = useId();
	const customInputId = useId();

	const easingDuration =
		selectedDuration === 'custom'
			? `${ customDuration }ms`
			: selectedDuration;

	return (
		<div className={ styles.wrapper }>
			<button className={ styles.replayButton } onClick={ replay }>
				Replay animations
			</button>

			<div>
				<h3 className={ styles.sectionTitle }>Easing curves</h3>
				<div className={ styles.controls }>
					<label
						className={ styles.controlLabel }
						htmlFor={ selectId }
					>
						Duration:
					</label>
					<select
						id={ selectId }
						className={ styles.select }
						value={ selectedDuration }
						onChange={ ( e ) => {
							setSelectedDuration( e.target.value );
							setAnimKey( ( k ) => k + 1 );
						} }
					>
						{ DURATION_OPTIONS.map( ( opt ) => (
							<option key={ opt.value } value={ opt.value }>
								{ opt.label }
							</option>
						) ) }
					</select>
					{ selectedDuration === 'custom' && (
						<>
							<label
								className={ styles.controlLabel }
								htmlFor={ customInputId }
							>
								Value:
							</label>
							<input
								id={ customInputId }
								className={ styles.customInput }
								type="number"
								min="0"
								max="5000"
								step="50"
								value={ customDuration }
								onChange={ ( e ) => {
									setCustomDuration( e.target.value );
									setAnimKey( ( k ) => k + 1 );
								} }
							/>
							<span className={ styles.controlLabel }>ms</span>
						</>
					) }
				</div>
				<div className={ styles.rows }>
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
				</div>
			</div>

			<div>
				<h3 className={ styles.sectionTitle }>Durations</h3>
				<p className={ styles.sectionDescription }>
					All using easing-standard
				</p>
				<div className={ styles.rows }>
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
				</div>
			</div>
		</div>
	);
}

export const Default: StoryObj< typeof ThemeProvider > = {
	args: {
		children: <MotionDemo />,
	},
};
