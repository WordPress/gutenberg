/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Composite, Tooltip } from '@wordpress/components';
import { Icon, check } from '@wordpress/icons';

/**
 * External dependencies
 */
import clsx from 'clsx';

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

function BackgroundClipPreview( { value } ) {
	const isText = value === 'text';

	return (
		<span
			aria-hidden="true"
			className={ clsx( 'block-editor-background-clip-control__preview', {
				'is-text': isText,
			} ) }
			style={ {
				backgroundClip: value,
				WebkitBackgroundClip: value,
			} }
		>
			{ isText && 'Ab' }
		</span>
	);
}

function BackgroundClipOption( { label, value, isActive, onSelect } ) {
	return (
		<Tooltip text={ label }>
			<Composite.Item
				role="option"
				aria-label={ label }
				aria-selected={ isActive }
				className={ clsx(
					'block-editor-background-clip-control__item',
					{
						'is-active': isActive,
					}
				) }
				render={
					<button
						className="block-editor-background-clip-control__option"
						onClick={ onSelect }
					>
						<BackgroundClipPreview value={ value } />
						{ isActive && <Icon icon={ check } /> }
					</button>
				}
			/>
		</Tooltip>
	);
}

export default function BackgroundClipControl( { value, onChange } ) {
	return (
		<Composite
			role="listbox"
			className="block-editor-background-clip-control__list"
			aria-label={ __( 'Background clip' ) }
		>
			{ BACKGROUND_CLIP_OPTIONS.map( ( option ) => (
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
		</Composite>
	);
}
