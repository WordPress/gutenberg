/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useMark } from './hook';
import { View } from '../../view';

import type { MarkProps } from '../types';

const UnconnectedMark = (
	props: WordPressComponentProps< MarkProps, 'span' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		className,
		isFilled = false,
		label,
		labelClassName,
		style = {},
		...otherProps
	} = useMark( props );

	return (
		<>
			<View
				as="span"
				{ ...otherProps }
				aria-hidden="true"
				className={ className }
				style={ style }
				ref={ forwardedRef }
			/>
			{ label && (
				<View
					as="span"
					aria-hidden="true"
					className={ labelClassName }
					style={ style }
				>
					{ label }
				</View>
			) }
		</>
	);
};

export const Mark = contextConnect( UnconnectedMark, 'Mark' );
export default Mark;
