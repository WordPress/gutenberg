/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';
import { rawShortcut } from '@wordpress/keycodes';

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
		const { character, type } = this.props;

		return (
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					[ rawShortcut[ type ]( character ) ]: this.onUse,
				} }
			/>
		);
	}
}
