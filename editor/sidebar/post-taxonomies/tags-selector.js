/**
 * WordPress dependencies
 */
import { Component } from 'element';
import FormTokenField from 'components/form-token-field';

class TagsSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onTokensChange = this.onTokensChange.bind( this );
		this.state = {
			tokens: [ 'React', 'Vue' ],
		};
	}

	onTokensChange( value ) {
		this.setState( { tokens: value } );
	}

	render() {
		const suggestions = [ 'React', 'Vue', 'Angular', 'Cycle', 'PReact', 'Inferno' ];

		return (
			<div className="editor-post-taxonomies__tags-selector">
				<FormTokenField
					value={ this.state.tokens }
					suggestions={ suggestions }
					onChange={ this.onTokensChange }
				/>
			</div>
		);
	}
}

export default TagsSelector;

