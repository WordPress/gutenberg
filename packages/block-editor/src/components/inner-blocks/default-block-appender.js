/**
 * Internal dependencies
 */
import BaseDefaultBlockAppender from '../default-block-appender';
import { useBlockEditContext } from '../block-edit/context';

export default function DefaultBlockAppender() {
	const { clientId } = useBlockEditContext();
	return <BaseDefaultBlockAppender rootClientId={ clientId } />;
}
