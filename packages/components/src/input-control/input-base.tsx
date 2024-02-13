/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getSizeConfig } from './styles/input-control-styles';
import * as styles from './styles/input-control-styles';
import type { InputBaseProps, LabelPosition } from './types';
import type { WordPressComponentProps } from '../context';
import {
	ContextSystemProvider,
	contextConnect,
	useContextSystem,
} from '../context';
import { useDeprecated36pxDefaultSizeProp } from '../utils/use-deprecated-props';
import { useCx } from '../utils';

// function useUniqueId( idProp?: string ) {
// 	const instanceId = useInstanceId( InputBase );
// 	const id = `input-base-control-${ instanceId }`;

// 	return idProp || id;
// }

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

export function InputBase(
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

	// const id = useUniqueId( idProp );

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

	const cx = useCx();
	const rootClasses = cx(
		styles.inputBase,
		// styles.inputBaseFocusedStyles( isFocused ),
		className
	);
	const containerClasses = cx(
		styles.inputBaseContainer,
		// styles.inputBaseContainerDisabledStyles( disabled ),
		// styles.inputBaseContainerWidthStyles( {
		// 	__unstableInputWidth,
		// 	labelPosition,
		// } ),
		'components-input-control__container'
	);

	return (
		<div
			{ ...restProps }
			{ ...getUIFlexProps( labelPosition ) }
			className={ rootClasses }
			// gap={ 2 }
			ref={ ref }
		>
			{ /* <Label
				className="components-input-control__label"
				hideLabelFromVision={ hideLabelFromVision }
				labelPosition={ labelPosition }
				htmlFor={ id }
			>
				{ label }
			</Label> */ }
			<div className={ containerClasses }>
				<ContextSystemProvider value={ prefixSuffixContextValue }>
					{ prefix && (
						<span
							className={ cx(
								styles.prefix,
								'components-input-control__prefix'
							) }
						>
							{ prefix }
						</span>
					) }
					{ children }
					{ suffix && (
						<span
							className={ cx(
								styles.suffix,
								'components-input-control__suffix'
							) }
						>
							{ suffix }
						</span>
					) }
				</ContextSystemProvider>
				{ /* <Backdrop
					disabled={ disabled }
					isBorderless={ isBorderless }
					isFocused={ isFocused }
				/> */ }
			</div>
		</div>
	);
}

export default contextConnect( InputBase, 'InputBase' );
