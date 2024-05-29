/**
 * External dependencies
 */
import { act, measurePerformance } from 'test/helpers';
import Clipboard from '@react-native-clipboard/clipboard';

/**
 * Internal dependencies
 */
import { LinkPicker } from '../../index';

describe( 'LinkPicker', () => {
	const onLinkPicked = jest.fn();
	const onCancel = jest.fn();
	const clipboardResult = Promise.resolve( '' );
	Clipboard.getString.mockReturnValue( clipboardResult );

	it( 'performance is stable when clipboard results do not change', async () => {
		const scenario = async () => {
			// Given the clipboard result is an empty string, there are no
			// user-facing changes to query. Thus, we must await the promise
			// itself.
			await act( () => clipboardResult );
		};

		await measurePerformance(
			<LinkPicker
				onLinkPicked={ onLinkPicked }
				onCancel={ onCancel }
				value=""
			/>,
			{ scenario }
		);
	} );
} );
