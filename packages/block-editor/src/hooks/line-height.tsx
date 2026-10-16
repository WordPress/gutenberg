import { hasBlockSupport } from '@wordpress/blocks';
import LineHeightControl from '../components/line-height-control';
import { cleanEmptyObject } from './utils';
import { useSettings } from '../components/use-settings';
import type { LineHeightEditProps } from './types';

export const LINE_HEIGHT_SUPPORT_KEY = 'typography.lineHeight';

/**
 * Inspector control panel containing the line height related configuration
 *
 * @param props Component props.
 *
 * @return Line height edit element.
 */
export function LineHeightEdit( props: LineHeightEditProps ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const onChange = ( newLineHeightValue?: string | number ) => {
		const newStyle = {
			...style,
			typography: {
				...style?.typography,
				lineHeight: newLineHeightValue,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};
	return (
		<LineHeightControl
			__unstableInputWidth="100%"
			value={ style?.typography?.lineHeight }
			onChange={ onChange }
		/>
	);
}

/**
 * Custom hook that checks if line-height settings have been disabled.
 *
 * @param $0      Block props.
 * @param $0.name The name of the block.
 * @return Whether setting is disabled.
 */
export function useIsLineHeightDisabled( {
	name: blockName,
}: { name?: string } = {} ) {
	const [ isEnabled ] = useSettings( 'typography.lineHeight' );

	return (
		! isEnabled ||
		// `hasBlockSupport` returns false for a missing block name.
		! hasBlockSupport( blockName as string, LINE_HEIGHT_SUPPORT_KEY )
	);
}
