import { registerFormatType } from '@wordpress/rich-text';
import { annotation } from './annotation';

const { name, ...settings } = annotation;

registerFormatType( name, settings as any );
