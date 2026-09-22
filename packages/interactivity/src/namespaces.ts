const namespaceStack: string[] = [];

export const getNamespace = () => namespaceStack.slice( -1 )[ 0 ];

export const setNamespace = ( namespace: string ) => {
	namespaceStack.push( namespace );
};
export const resetNamespace = () => {
	namespaceStack.pop();
};
