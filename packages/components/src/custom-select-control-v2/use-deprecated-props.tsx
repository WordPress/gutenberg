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
	return typeof props.options !== 'undefined';
}

const transformOptionsToChildren = (
	options: LegacyCustomSelectProps[ 'options' ]
) => {
	if ( options === undefined ) {
		return;
	}

	return options.map( ( { name, key, ...rest }: any ) => (
		<CustomSelectItem value={ name } key={ key } { ...rest } />
	) );
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
		return {
			children: transformOptionsToChildren( props.options ),
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
