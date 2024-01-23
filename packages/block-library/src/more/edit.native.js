/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
import { HorizontalRule } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

export class MoreEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			defaultText: __( 'Read more' ),
		};
	}

	render() {
		const { attributes, getStylesFromColorScheme } = this.props;
		const { customText } = attributes;
		const { defaultText } = this.state;

		const content = customText || defaultText;
		const textStyle = getStylesFromColorScheme(
			styles.moreText,
			styles.moreTextDark
		);
		const lineStyle = getStylesFromColorScheme(
			styles.moreLine,
			styles.moreLineDark
		);

		return (
			<HorizontalRule
				text={ content }
				marginLeft={ 0 }
				marginRight={ 0 }
				textStyle={ textStyle }
				lineStyle={ lineStyle }
			/>
		);
	}
}

export default withPreferredColorScheme( MoreEdit );
