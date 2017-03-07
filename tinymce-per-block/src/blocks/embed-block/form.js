/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import { EnhancedInputComponent } from 'wp-blocks';
import BlockArrangement from 'controls/block-arrangement';
import { getEmbedHtmlFromUrl } from '../../utils/embed';

export default class EmbedBlockForm extends Component {
	merge = () => {
		this.props.remove();
	};

	bindInput = ( ref ) => {
		this.input = ref;
	};

	render() {
		const { block, isSelected, change, moveUp, moveDown, remove, focusConfig, focus } = this.props;

		const removePrevious = () => {
			if ( ! block.url ) {
				remove();
			}
		};

		const html = getEmbedHtmlFromUrl( block.url );

		return (
			<div>
				{ isSelected && <BlockArrangement block={ block } /> }
				<div className="embed-block__form">
					<div className="embed-block__content" dangerouslySetInnerHTML={ { __html: html } } />
					<EnhancedInputComponent
						ref={ this.bindInput }
						moveUp={ moveUp }
						removePrevious={ removePrevious }
						moveDown={ moveDown }
						value={ block.url }
						onChange={ ( value ) => change( { url: value } ) }
						focusConfig={ focusConfig }
						onFocusChange={ ( config ) => focus( config ) }
						placeholder="Enter an embed URL"
					/>
				</div>
			</div>
		);
	}
}
