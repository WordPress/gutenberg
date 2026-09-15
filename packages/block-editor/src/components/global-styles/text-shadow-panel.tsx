import { __ } from '@wordpress/i18n';
import {
	Button,
	Composite,
	Dropdown,
	SelectControl,
} from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { useRef, useMemo } from '@wordpress/element';
import { shadow as textShadowIcon, Icon, check, reset } from '@wordpress/icons';
import type { TextShadowPreset } from '@wordpress/global-styles-engine';
import clsx from 'clsx';
import { useSettings } from '../use-settings';

type TextShadowValue = string | undefined;

interface TextShadowProps {
	textShadow: TextShadowValue;
	onChange: ( textShadow: TextShadowValue ) => void;
}

interface TextShadowToggleProps extends TextShadowProps {
	onToggle: () => void;
	isOpen: boolean;
}

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 */
const EMPTY_ARRAY: TextShadowPreset[] = [];

// Above this number of presets, the list is rendered as a compact dropdown
// rather than a long list of options.
const PRESETS_SELECT_THRESHOLD = 7;

/**
 * Extracts the preset slug from a raw text shadow value.
 *
 * @param rawValue The stored text shadow value.
 * @return The preset slug, or undefined for custom values.
 */
function getTextShadowPresetSlug( rawValue: TextShadowValue ) {
	if ( ! rawValue || typeof rawValue !== 'string' ) {
		return undefined;
	}

	// Block supports use the `var:preset|text-shadow|slug` format.
	if ( rawValue.startsWith( 'var:preset|text-shadow|' ) ) {
		return rawValue.replace( 'var:preset|text-shadow|', '' );
	}

	// Global styles data uses the `var(--wp--preset--text-shadow--slug)` format.
	const cssVarMatch = rawValue.match(
		/^var\(--wp--preset--text-shadow--([^)]+)\)$/
	);
	if ( cssVarMatch ) {
		return cssVarMatch[ 1 ];
	}

	return undefined;
}

export function TextShadowPopover( { textShadow, onChange }: TextShadowProps ) {
	const popoverProps = {
		placement: 'left-start' as const,
		offset: 36,
		shift: true,
		className: 'block-editor-global-styles__text-shadow-popover',
	};

	return (
		<Dropdown
			popoverProps={ popoverProps }
			className="block-editor-global-styles__text-shadow-dropdown"
			renderToggle={ ( { onToggle, isOpen } ) => (
				<TextShadowToggle
					textShadow={ textShadow }
					onChange={ onChange }
					onToggle={ onToggle }
					isOpen={ isOpen }
				/>
			) }
			renderContent={ () => (
				<TextShadowControl
					textShadow={ textShadow }
					onChange={ onChange }
				/>
			) }
		/>
	);
}

function TextShadowControl( { textShadow, onChange }: TextShadowProps ) {
	const [
		defaultPresetsEnabled,
		defaultPresets,
		themePresets,
		customPresets,
	] = useSettings(
		'typography.defaultTextShadowPresets',
		'typography.textShadowPresets.default',
		'typography.textShadowPresets.theme',
		'typography.textShadowPresets.custom'
	) as [
		boolean | undefined,
		TextShadowPreset[] | undefined,
		TextShadowPreset[] | undefined,
		TextShadowPreset[] | undefined,
	];

	const presets = useMemo(
		() => [
			...( ( defaultPresetsEnabled && defaultPresets ) || EMPTY_ARRAY ),
			...( themePresets || EMPTY_ARRAY ),
			...( customPresets || EMPTY_ARRAY ),
		],
		[ defaultPresetsEnabled, defaultPresets, themePresets, customPresets ]
	);

	const choices = [
		{ value: 'none', label: __( 'None' ) },
		...presets.map( ( preset ) => ( {
			value: `var:preset|text-shadow|${ preset.slug }`,
			label: preset.name,
		} ) ),
	];

	const activeSlug = getTextShadowPresetSlug( textShadow );
	const activeValue = activeSlug
		? `var:preset|text-shadow|${ activeSlug }`
		: textShadow ?? '';
	const previewValue = activeSlug
		? presets.find( ( preset ) => preset.slug === activeSlug )?.textShadow
		: textShadow;

	return (
		<Stack
			className="block-editor-global-styles__text-shadow"
			direction="column"
			gap="sm"
		>
			<Text variant="heading-sm" render={ <h2 /> }>
				{ __( 'Text shadow' ) }
			</Text>
			<div
				className="block-editor-global-styles__text-shadow-preview"
				style={ { textShadow: previewValue } }
			>
				{ __( 'Code is poetry' ) }
			</div>
			{ presets.length >= PRESETS_SELECT_THRESHOLD ? (
				<SelectControl
					hideLabelFromVision
					label={ __( 'Text shadow preset' ) }
					value={ activeValue }
					options={ [
						{ value: '', label: __( 'Default' ) },
						...choices,
					] }
					onChange={ onChange }
				/>
			) : (
				<Composite
					role="listbox"
					aria-label={ __( 'Text shadow presets' ) }
					render={ <Stack direction="column" /> }
				>
					{ choices.map( ( { value, label } ) => {
						const isActive = value === activeValue;
						return (
							<Composite.Item
								key={ value }
								role="option"
								aria-selected={ isActive }
								className={ clsx(
									'block-editor-global-styles__text-shadow-list-item',
									{ 'is-active': isActive }
								) }
								onClick={ () => onChange( value ) }
								render={ <Button __next40pxDefaultSize /> }
							>
								<span>{ label }</span>
								<Icon icon={ check } />
							</Composite.Item>
						);
					} ) }
				</Composite>
			) }
			<Stack direction="row" justify="flex-end">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ () => onChange( undefined ) }
					disabled={ ! textShadow }
					accessibleWhenDisabled
				>
					{ __( 'Clear' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

function TextShadowToggle( {
	textShadow,
	onChange,
	onToggle,
	isOpen,
}: TextShadowToggleProps ) {
	const buttonRef = useRef< HTMLButtonElement >( undefined );

	return (
		<>
			<Button
				__next40pxDefaultSize
				onClick={ onToggle }
				className={ clsx(
					'block-editor-global-styles__text-shadow-dropdown-toggle',
					{ 'is-open': isOpen }
				) }
				aria-expanded={ isOpen }
				ref={ buttonRef }
			>
				<Stack
					direction="row"
					justify="flex-start"
					align="center"
					gap="sm"
				>
					<Icon icon={ textShadowIcon } size={ 24 } />
					<span>{ __( 'Text shadow' ) }</span>
				</Stack>
			</Button>
			{ !! textShadow && (
				<Button
					__next40pxDefaultSize
					size="small"
					icon={ reset }
					onClick={ () => {
						if ( isOpen ) {
							onToggle();
						}
						onChange( undefined );
						// Return focus to parent button.
						buttonRef.current?.focus();
					} }
					className={ clsx(
						'block-editor-global-styles__text-shadow-remove-button',
						{ 'is-open': isOpen }
					) }
					label={ __( 'Remove text shadow' ) }
				/>
			) }
		</>
	);
}
