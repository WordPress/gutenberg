/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import ValidatedText from './utils/validated-input';

export default function Time< Item >( props: DataFormControlProps< Item > ) {
	return <ValidatedText { ...props } type="time" />;
}
