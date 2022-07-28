/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useMarks } from './hook';
import { View } from '../../view';
import { Mark } from '../mark/component';

import type { MarksProps } from '../types';

const UnconnectedMarks = (
	props: WordPressComponentProps< MarksProps, 'input', false >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const { className, disabled = false, marksData } = useMarks( props );
	return (
		<View
			as="span"
			aria-hidden="true"
			className={ className }
			ref={ forwardedRef }
		>
			{ marksData.map( ( mark ) => (
				<Mark
					{ ...mark }
					key={ mark.key }
					aria-hidden="true"
					disabled={ disabled }
				/>
			) ) }
		</View>
	);
};

export const Marks = contextConnect( UnconnectedMarks, 'Marks' );
export default Marks;
