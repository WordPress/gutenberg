/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CustomSelectItem } from '.';
import type { CustomSelectProps, LegacyCustomSelectProps } from './types';
import deprecated from '@wordpress/deprecated';

function isLegacyProps( props: any ): props is LegacyCustomSelectProps {
	return (
		typeof props.options !== 'undefined' ||
		props.__experimentalShowSelectedHint !== undefined
	);
}

const transformOptionsToChildren = ( props: LegacyCustomSelectProps ) => {
	if ( props.options === undefined ) {
		return;
	}

	return props.options.map(
		( { name, key, __experimentalHint, ...rest }: any ) => {
			const withHint = (
				<>
					<span>{ name }</span>
					<span className="components-custom-select-control__item-hint">
						{ __experimentalHint }
					</span>
				</>
			);

			return (
				<CustomSelectItem
					{ ...rest }
					key={ key }
					value={ name }
					children={
						props.__experimentalShowSelectedHint ? withHint : name
					}
				/>
			);
		}
	);
};

export function useDeprecatedProps(
	props: LegacyCustomSelectProps | CustomSelectProps
): CustomSelectProps {
	const { onChange: onChangeLegacy } = props as LegacyCustomSelectProps;
	const legacyChangeHandler = useCallback(
		( value: string | string[] ) => {
			if ( Array.isArray( value ) ) {
				// The legacy version of the component doesn't handle multiple selection.
				return;
			}

			onChangeLegacy?.( {
				selectedItem: { name: value, key: 'TODO' },
			} );
		},
		[ onChangeLegacy ]
	);

	if ( isLegacyProps( props ) ) {
		if ( props.__nextUnconstrainedWidth ) {
			deprecated(
				'Constrained width styles for wp.components.CustomSelectControl',
				{
					hint: 'This behaviour is now built-in.',
					since: '6.4',
				}
			);
		}

		const legacyProps = {
			'aria-describedby': props.describedBy,
		};

		return {
			...legacyProps,
			children: transformOptionsToChildren( props ),
			label: props.label,
			onChange: legacyChangeHandler,
		};
	}

	return {
		...props,
		children: ( props as CustomSelectProps ).children,
		onChange: ( props as CustomSelectProps ).onChange,
	};
}
