import type { CSSProperties, ForwardedRef } from 'react';
import clsx from 'clsx';
import { useInstanceId } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import Backdrop from './backdrop';
import Label from './label';
import styles from './style.module.scss';
import { Flex } from '../flex';
import type { InputBaseProps, LabelPosition } from './types';
import type { WordPressComponentProps } from '../context';
import {
	ContextSystemProvider,
	contextConnect,
	useContextSystem,
} from '../context';
import type { FlexDirection } from '../flex/types';

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( InputBase );
	const id = `input-base-control-${ instanceId }`;

	return idProp || id;
}

// Adapter to map props for the new ui/flex component.
function getUIFlexProps( labelPosition?: LabelPosition ) {
	const props: {
		direction?: FlexDirection;
		gap?: number;
		justify?: string;
		expanded?: boolean;
	} = {};
	switch ( labelPosition ) {
		case 'top':
			props.direction = 'column';
			props.expanded = false;
			props.gap = 0;
			break;
		case 'bottom':
			props.direction = 'column-reverse';
			props.expanded = false;
			props.gap = 0;
			break;
		case 'edge':
			props.justify = 'space-between';
			break;
	}

	return props;
}

function InputBase(
	props: WordPressComponentProps< InputBaseProps, 'div' >,
	ref: ForwardedRef< HTMLDivElement >
) {
	const {
		__unstableInputWidth,
		children,
		className,
		disabled = false,
		hideLabelFromVision = false,
		labelPosition,
		id: idProp,
		isBorderless = false,
		label,
		prefix,
		size = 'default',
		suffix,
		...restProps
	} = useContextSystem( props, 'InputBase' );

	const id = useUniqueId( idProp );

	const prefixSuffixContextValue = useMemo( () => {
		return {
			InputControlPrefixWrapper: { size },
			InputControlSuffixWrapper: { size },
		};
	}, [ size ] );

	const widthKeyword =
		typeof __unstableInputWidth === 'string' &&
		[ 'inherit', 'initial', 'revert', 'revert-layer', 'unset' ].includes(
			__unstableInputWidth
		)
			? __unstableInputWidth
			: undefined;
	const hasWidth = !! __unstableInputWidth;
	const hasCustomWidth =
		hasWidth && labelPosition !== 'side' && labelPosition !== 'edge';
	// The previous flex shorthand ignored numeric widths and CSS-wide keywords.
	const hasEdgeWidth =
		labelPosition === 'edge' &&
		typeof __unstableInputWidth === 'string' &&
		hasWidth &&
		! widthKeyword;
	const cssWidth =
		typeof __unstableInputWidth === 'number'
			? `${ __unstableInputWidth }px`
			: __unstableInputWidth;
	const containerStyle = {
		'--_wp-components-input-control-width':
			( hasCustomWidth && ! widthKeyword ) || hasEdgeWidth
				? cssWidth
				: undefined,
	} as CSSProperties;

	return (
		<Flex
			{ ...restProps }
			{ ...getUIFlexProps( labelPosition ) }
			className={ clsx( styles.root, className ) }
			gap={ 2 }
			ref={ ref }
		>
			<Label
				className="components-input-control__label"
				hideLabelFromVision={ hideLabelFromVision }
				labelPosition={ labelPosition }
				htmlFor={ id }
			>
				{ label }
			</Label>
			<div
				{ ...{ disabled } }
				className={ clsx(
					'components-input-control__container',
					styles.container,
					{
						[ styles[ 'is-disabled' ] ]: disabled,
						[ styles[ 'full-width' ] ]: ! hasWidth,
						[ styles[ 'custom-width' ] ]:
							hasCustomWidth && ! widthKeyword,
						[ styles[ 'edge-width' ] ]: hasEdgeWidth,
					},
					hasCustomWidth &&
						widthKeyword &&
						styles[ `width-${ widthKeyword }` ]
				) }
				style={ containerStyle }
			>
				<ContextSystemProvider value={ prefixSuffixContextValue }>
					{ prefix && (
						<span
							className={ clsx(
								'components-input-control__prefix',
								styles.prefix
							) }
						>
							{ prefix }
						</span>
					) }
					{ children }
					{ suffix && (
						<span
							className={ clsx(
								'components-input-control__suffix',
								styles.suffix
							) }
						>
							{ suffix }
						</span>
					) }
				</ContextSystemProvider>
				<Backdrop disabled={ disabled } isBorderless={ isBorderless } />
			</div>
		</Flex>
	);
}

/**
 * `InputBase` is an internal component used to style the standard borders for an input,
 * as well as handle the layout for prefix/suffix elements.
 */
export default contextConnect( InputBase, 'InputBase' );
