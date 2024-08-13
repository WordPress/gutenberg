/**
 * External dependencies
 */
import type { ChangeEvent, ForwardedRef, JSX, Ref } from 'react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import type { WordPressComponentProps } from '../context';
import type {
	TextControlProps,
	TextControlPropsType,
	ValueOfType,
} from './types';

function UnforwardedTextControl< T extends TextControlPropsType = 'text' >(
	props: WordPressComponentProps< TextControlProps< T >, 'input', false >,
	ref: ForwardedRef< HTMLInputElement >
) {
	const {
		__nextHasNoMarginBottom,
		__next40pxDefaultSize = false,
		label,
		hideLabelFromVision,
		value,
		help,
		id: idProp,
		className,
		onChange,
		type = 'text',
		...additionalProps
	} = props;
	const id = useInstanceId( TextControl, 'inspector-text-control', idProp );
	const onChangeValue = ( event: ChangeEvent< HTMLInputElement > ) =>
		onChange(
			( type === 'number'
				? event.target.valueAsNumber
				: event.target.value ) as ValueOfType< T >
		);

	return (
		<BaseControl
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			help={ help }
			className={ className }
		>
			<input
				className={ clsx( 'components-text-control__input', {
					'is-next-40px-default-size': __next40pxDefaultSize,
				} ) }
				type={ type }
				id={ id }
				value={ value }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				ref={ ref }
				{ ...additionalProps }
			/>
		</BaseControl>
	);
}

/**
 * TextControl components let users enter and edit text.
 *
 * ```jsx
 * import { TextControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyTextControl = () => {
 *   const [ className, setClassName ] = useState( '' );
 *
 *   return (
 *     <TextControl
 *       __nextHasNoMarginBottom
 *       label="Additional CSS Class"
 *       value={ className }
 *       onChange={ ( value ) => setClassName( value ) }
 *     />
 *   );
 * };
 * ```
 */
export const TextControl = forwardRef( UnforwardedTextControl ) as <
	T extends TextControlPropsType = 'text',
>(
	props: WordPressComponentProps< TextControlProps< T >, 'input', false > & {
		ref?: Ref< HTMLInputElement >;
	}
) => JSX.Element;

export default TextControl;
