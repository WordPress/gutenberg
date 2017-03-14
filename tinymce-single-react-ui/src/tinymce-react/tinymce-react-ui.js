import { createElement, Component, render } from 'wp-elements';
import tinymce from 'tinymce';
import TinyMCE from 'react-tinymce';

export default class TinyMCEReactUI extends Component {
  handleEditorChange = (e) => {
    console.log('Content was updated:', e.target.getContent());
  }

  render() {
    return (
      <div>
        <div>Menu DIVS all up here</div>
        <TinyMCE
          content="<p>This is the initial content of the editor</p><p>It has some lines</p>"
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
