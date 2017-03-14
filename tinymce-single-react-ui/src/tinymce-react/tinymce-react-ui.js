import { render } from 'react-dom';
import { createElement, Component } from 'react';
import TinyMCE from 'react-tinymce';
import './react-toolbar'
import './react-block'

export default class TinyMCEReactUI extends Component {
  constructor(props) {
    super(props);
  }

  handleEditorChange = (e) => {
    console.log('Content was updated:', e.target.getContent());
  }

  render() {
    return (
        <TinyMCE
          content={this.props.content}
          config={{
            theme: false,
            inline: true,
            toolbar: false,
            menubar: false,
            keep_styles: false,
            browser_spellcheck: true,
            plugins: [
              'react-toolbar', // fns to make button, list-box, menuitem,...
              'react-block'    // block toolbar
              ],
            skin_url: '//s1.wp.com/wp-includes/js/tinymce/skins/lightgray',
            entity_encoding: 'raw',
            schema: 'html5-strict',
            formats: {
              strikethrough: { inline: 'del' }
            }
          }}
          onChange={this.handleEditorChange}
        />
    );
  }
}
