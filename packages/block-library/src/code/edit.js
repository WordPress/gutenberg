/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Button, Tooltip } from '@wordpress/components';
import { help } from '@wordpress/icons';

export default function CodeEdit() {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<p>Button with no children</p>
			<Button icon={ help } label="label" variant="primary"></Button>

			<p>Button with empty flagment children</p>
			<Button icon={ help } label="label" variant="primary">
				<></>
			</Button>

			<p>Button with Tooltip</p>
			<Tooltip text="Tooltip!">
				<Button icon={ help } label="label" variant="primary" />
			</Tooltip>

			<p>Should have .has-text class as in the past</p>
			<Button icon={ help } label="label" variant="primary">
				Push Me
			</Button>
		</div>
	);
}
