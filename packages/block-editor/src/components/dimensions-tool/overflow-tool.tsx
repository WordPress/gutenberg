import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import type { ReactNode } from 'react';
import { __, _x } from '@wordpress/i18n';
import type { DimensionsToolOption, OverflowToolProps } from './types';

const DEFAULT_OVERFLOW_OPTIONS: DimensionsToolOption[] = [
	{
		value: 'visible',
		label: _x( 'Visible', 'Overflow option for dimensions control' ),
		help: __( 'Content extends outside the container.' ),
	},
	{
		value: 'clip',
		label: _x( 'Clip', 'Overflow option for dimensions control' ),
		help: __(
			'Content is clipped to the container without creating a scroll container.'
		),
	},
	{
		value: 'hidden',
		label: _x( 'Hidden', 'Overflow option for dimensions control' ),
		help: __(
			'Content is clipped to the container with hidden scrollbars.'
		),
	},
];

/**
 * A tool to select the CSS overflow property for a container block.
 *
 * @param {OverflowToolProps} props The component props.
 *
 * @return The overflow tool.
 */
export default function OverflowTool( {
	panelId,
	value,
	onChange,
	options = DEFAULT_OVERFLOW_OPTIONS,
	isShownByDefault = false,
	hasValue: hasValueProp,
}: OverflowToolProps ) {
	const overflowHelp = useMemo( () => {
		return options.reduce(
			( acc, option ) => {
				acc[ option.value ] = option.help;
				return acc;
			},
			{} as Record< string, ReactNode >
		);
	}, [ options ] );

	const hasValue =
		hasValueProp ?? ( () => value !== undefined && value !== null );

	return (
		<ToolsPanelItem
			label={ _x( 'Overflow', 'Dimensions overflow control label' ) }
			isShownByDefault={ isShownByDefault }
			hasValue={ hasValue }
			onDeselect={ () => onChange( undefined ) }
			panelId={ panelId }
		>
			<ToggleGroupControl
				label={ _x( 'Overflow', 'Dimensions overflow control label' ) }
				isBlock
				isDeselectable
				help={ value ? overflowHelp[ value ] : undefined }
				value={ value ?? '' }
				onChange={ ( nextValue?: string | number ) => {
					onChange(
						nextValue === '' ? undefined : ( nextValue as string )
					);
				} }
			>
				{ options.map( ( option ) => (
					<ToggleGroupControlOption
						key={ option.value }
						{ ...option }
					/>
				) ) }
			</ToggleGroupControl>
		</ToolsPanelItem>
	);
}
