import { render } from 'react-dom';
import { createElement, Component } from 'react';
import TinyMCE from 'react-tinymce';

export default class TinyMCEReactUI extends Component {
  constructor(props) {
    super(props);
  }

  handleEditorChange = (e) => {
    console.log('Content was updated:', e.target.getContent());
  }

  render() {
    return (
      <div>
        <div>Menu DIVS all up here</div>
        <TinyMCE
          content={this.props.content}
          config={{
            theme: false,
            inline: true,
            toolbar: false,
            skin_url: '//s1.wp.com/wp-includes/js/tinymce/skins/lightgray',
            entity_encoding: 'raw',
            formats: {
              strikethrough: { inline: 'del' }
            }
          }}
          onChange={this.handleEditorChange}
        />
      </div>
    );
  }
}
