/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';

export class RichTextShortcut extends Component {
	constructor() {
		super( ...arguments );
		this.onUse = this.onUse.bind( this );
	}

	onUse() {
		this.props.onUse();
		return false;
	}

	render() {
		const { character } = this.props;

		return (
			<KeyboardShortcuts
				onUse={ this.onUse }
				character={ character }
			/>
		);
	}
}
