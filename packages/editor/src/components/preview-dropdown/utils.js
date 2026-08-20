import { DESIGN_POST_TYPES } from '../../store/constants';

export function shouldShowTemplateOption( { postType, templateId } ) {
	return !! templateId && ! DESIGN_POST_TYPES.includes( postType );
}
