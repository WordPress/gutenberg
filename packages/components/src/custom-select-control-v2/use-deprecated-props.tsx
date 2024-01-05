/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CustomSelectItem } from '.';
import { LegacyHint } from './styles';
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
					<LegacyHint>{ __experimentalHint }</LegacyHint>
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

const adaptSizes = ( props: LegacyCustomSelectProps ) => {
	if ( props.options === undefined ) {
		return;
	}

	const adaptedSize =
		props.size === 'default' || props.size === '__unstable-large'
			? 'default'
			: 'small';

	return adaptedSize;
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
			// temp ignore
			//@ts-ignore
			defaultValue: props?.value?.name ?? undefined,
			label: props.label ?? '',
			onChange: legacyChangeHandler,
			size: adaptSizes( props ),
		};
	}

	return {
		...props,
		children: ( props as CustomSelectProps ).children,
		onChange: ( props as CustomSelectProps ).onChange,
	};
}
