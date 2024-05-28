/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Backdrop from './backdrop';
import Label from './label';
import {
	Container,
	Root,
	Prefix,
	Suffix,
	getSizeConfig,
} from './styles/input-control-styles';
import type { InputBaseProps, LabelPosition } from './types';
import type { WordPressComponentProps } from '../context';
import {
	ContextSystemProvider,
	contextConnect,
	useContextSystem,
} from '../context';
import { useDeprecated36pxDefaultSizeProp } from '../utils/use-deprecated-props';

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( InputBase );
	const id = `input-base-control-${ instanceId }`;

	return idProp || id;
}

// Adapter to map props for the new ui/flex component.
function getUIFlexProps( labelPosition?: LabelPosition ) {
	const props: {
		direction?: string;
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
		__next40pxDefaultSize,
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
	} = useDeprecated36pxDefaultSizeProp(
		useContextSystem( props, 'InputBase' )
	);

	const id = useUniqueId( idProp );
	const hideLabel = hideLabelFromVision || ! label;

	const { paddingLeft, paddingRight } = getSizeConfig( {
		inputSize: size,
		__next40pxDefaultSize,
	} );
	const prefixSuffixContextValue = useMemo( () => {
		return {
			InputControlPrefixWrapper: { paddingLeft },
			InputControlSuffixWrapper: { paddingRight },
		};
	}, [ paddingLeft, paddingRight ] );

	return (
		// @ts-expect-error The `direction` prop from Flex (FlexDirection) conflicts with legacy SVGAttributes `direction` (string) that come from React intrinsic prop definitions.
		<Root
			{ ...restProps }
			{ ...getUIFlexProps( labelPosition ) }
			className={ className }
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
			<Container
				__unstableInputWidth={ __unstableInputWidth }
				className="components-input-control__container"
				disabled={ disabled }
				hideLabel={ hideLabel }
				labelPosition={ labelPosition }
			>
				<ContextSystemProvider value={ prefixSuffixContextValue }>
					{ prefix && (
						<Prefix className="components-input-control__prefix">
							{ prefix }
						</Prefix>
					) }
					{ children }
					{ suffix && (
						<Suffix className="components-input-control__suffix">
							{ suffix }
						</Suffix>
					) }
				</ContextSystemProvider>
				<Backdrop disabled={ disabled } isBorderless={ isBorderless } />
			</Container>
		</Root>
	);
}

/**
 * `InputBase` is an internal component used to style the standard borders for an input,
 * as well as handle the layout for prefix/suffix elements.
 */
export default contextConnect( InputBase, 'InputBase' );
