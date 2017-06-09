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
});

setUnknownTypeHandler('core/freeform');
