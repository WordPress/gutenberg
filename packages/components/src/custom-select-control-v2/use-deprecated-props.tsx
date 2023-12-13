/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CustomSelectItem } from '.';
import type { CustomSelectProps, LegacyCustomSelectProps } from './types';

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
			onChangeLegacy?.( {
				selectedItem: value,
			} );
		},
		[ onChangeLegacy ]
	);

	if ( isLegacyProps( props ) ) {
		return {
			children: transformOptionsToChildren( props ),
			label: props.label ?? '',
			onChange: legacyChangeHandler,
		};
	}

	return {
		...props,
		children: ( props as CustomSelectProps ).children,
		onChange: ( props as CustomSelectProps ).onChange,
	};
}
