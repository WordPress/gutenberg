/**
 * Internal dependencies
 */
import ColorPicker, { ColorPickerProps } from './component';
import { useDeprecatedProps, LegacyProps } from './use-deprecated-props';

type ColorPickerAdapterProps = LegacyProps | ColorPickerProps;

export const LegacyAdapter = ( props: ColorPickerAdapterProps ) => {
	const adaptedProps = useDeprecatedProps( props );

	return <ColorPicker { ...adaptedProps } />;
};
