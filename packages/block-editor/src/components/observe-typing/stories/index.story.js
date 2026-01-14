/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ObserveTyping from '../index';
import { store as blockEditorStore } from '../../../store';

export default {
	title: 'BlockEditor/ObserveTyping',
	component: ObserveTyping,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'ObserveTyping wraps content to detect user activity. It sets an internal "isTyping" flag to true when the user types, and false when they move the mouse or lose focus.',
			},
		},
	},
};

/**
 * This is a helper component to visualize the "isTyping" state
 */
function StatusIndicator() {
	const isTyping = useSelect(
		( select ) => select( blockEditorStore )?.isTyping(),
		[]
	);
	/* eslint-disable react/jsx-filename-extension */
	return (
		<div>
			<strong>isTyping State: </strong>
			{ isTyping ? 'TRUE' : 'FALSE' }
		</div>
	);
}

export const Default = {
	render: ( args ) => {
		return (
			<BlockEditorProvider>
				<div
					style={ {
						maxWidth: '500px',
					} }
				>
					<ObserveTyping { ...args }>
						<textarea
							style={ {
								width: '100%',
								height: '120px',
								padding: '10px',
							} }
							placeholder="Start typing here to trigger the observer..."
						/>
					</ObserveTyping>

					<StatusIndicator />
				</div>
			</BlockEditorProvider>
		);
	},
};
/* eslint-enable react/jsx-filename-extension */
