/**
 * Internal dependencies
 */


export const CREATE_STYLE = 'CREATE_STYLE';
export const DELETE_STYLE = 'DELETE_STYLE';
export const UPDATE_STYLE = 'UPDATE_STYLE';

export type Action< Type > = {
	type: Type;
	selector: string;
	value: {
		rule: string;
	};
};

export type CreateStyle = Action< typeof CREATE_STYLE >;
export type UpdateStyle = Action< typeof UPDATE_STYLE >;
export type DeleteStyle = Omit< Action< typeof DELETE_STYLE >, 'value' >;

export type StyleAction = CreateStyle | UpdateStyle | DeleteStyle;
