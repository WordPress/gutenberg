/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Dropdown,
	Button,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexBlock,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import clsx from 'clsx';

export const ALL_BACKGROUND_CLIP_VALUES = [
	'border-box',
	'padding-box',
	'content-box',
	'text',
];

const BACKGROUND_CLIP_OPTIONS = [
	{
		label: __( 'Border box' ),
		value: 'border-box',
	},
	{
		label: __( 'Padding box' ),
		value: 'padding-box',
	},
	{
		label: __( 'Content box' ),
		value: 'content-box',
	},
	{
		label: __( 'Text' ),
		value: 'text',
	},
];

const BACKGROUND_POPOVER_PROPS = {
	placement: 'left-start',
	offset: 36,
	shift: true,
	className: 'block-editor-background-clip-control__popover',
};

function BackgroundClipPreview( { value } ) {
	const isText = value === 'text';

	return (
		<span
			aria-hidden="true"
			className={ clsx( 'block-editor-background-clip-control__preview', {
				'is-text': isText,
				'is-padding-box': value === 'padding-box',
				'is-content-box': value === 'content-box',
			} ) }
		>
			{ isText && 'Ab' }
		</span>
	);
}

function BackgroundClipOption( { label, value, isActive, onSelect } ) {
	return (
		<button
			role="option"
			aria-label={ label }
			aria-selected={ isActive }
			className={ clsx( 'block-editor-background-clip-control__option', {
				'is-active': isActive,
			} ) }
			onClick={ onSelect }
		>
			<BackgroundClipPreview value={ value } />
			<span className="block-editor-background-clip-control__option-label">
				{ label }
			</span>
		</button>
	);
}

function BackgroundClipToggle( { value, toggleProps } ) {
	const activeOption = BACKGROUND_CLIP_OPTIONS.find(
		( option ) => option.value === value
	);
	const label = activeOption ? activeOption.label : __( 'Border box' );

	return (
		<Button __next40pxDefaultSize { ...toggleProps }>
			<HStack className="block-editor-background-clip-control__toggle-inner">
				<BackgroundClipPreview value={ value || 'border-box' } />
				<FlexBlock>{ label }</FlexBlock>
			</HStack>
		</Button>
	);
}

export default function BackgroundClipControl( {
	value,
	onChange,
	allowedValues,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );

	const options = allowedValues
		? BACKGROUND_CLIP_OPTIONS.filter( ( opt ) =>
				allowedValues.includes( opt.value )
		  )
		: BACKGROUND_CLIP_OPTIONS;

	return (
		<div
			className={ clsx(
				'block-editor-background-clip-control__container',
				{
					'is-open': isOpen,
				}
			) }
		>
			<Dropdown
				popoverProps={ BACKGROUND_POPOVER_PROPS }
				renderToggle={ ( { onToggle, isOpen: dropdownIsOpen } ) => {
					return (
						<BackgroundClipToggle
							value={ value }
							toggleProps={ {
								onClick: () => {
									onToggle();
									setIsOpen( ! dropdownIsOpen );
								},
								className:
									'block-editor-background-clip-control__dropdown-toggle',
								'aria-expanded': dropdownIsOpen,
								'aria-label': __( 'Background clip options' ),
							} }
						/>
					);
				} }
				onClose={ () => setIsOpen( false ) }
				renderContent={ () => (
					<DropdownContentWrapper
						className="block-editor-background-clip-control__dropdown-content-wrapper"
						paddingSize="medium"
					>
						<VStack spacing={ 2 }>
							<span className="block-editor-background-clip-control__popover-title">
								{ __( 'Background clip' ) }
							</span>
							<div
								role="listbox"
								className="block-editor-background-clip-control__options"
								aria-label={ __( 'Background clip' ) }
							>
								{ options.map( ( option ) => (
									<BackgroundClipOption
										key={ option.value }
										label={ option.label }
										value={ option.value }
										isActive={ value === option.value }
										onSelect={ () =>
											onChange(
												value === option.value
													? undefined
													: option.value
											)
										}
									/>
								) ) }
							</div>
						</VStack>
					</DropdownContentWrapper>
				) }
			/>
		</div>
	);
}
