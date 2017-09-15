import { registerBlockType, query, setUnknownTypeHandler } from '../../api';
import Component from './Component';

const { html } = query;

registerBlockType('core/freeform', {
  title: 'Freeform',
  icon: 'text',
  category: 'common',
  attributes: {
    content: html(),
  },
  defaultAttributes: {
    content: '',
  },
  edit: Component,
  save: ({ attributes }) => attributes.content,
});

setUnknownTypeHandler('core/freeform');
