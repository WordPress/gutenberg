import { fromJS } from 'immutable'

// TODO: use redux-actions

// TODO: replace nulls with Option values below
const initialState = fromJS({
  focused: false,  // does the editor have focus
  collapsed: null, // current selection is collapsed
  bookmark: null,  // current bookmark for restoring the selection
  node: null,      // current node of the selection (if collapsed) or common ancestor containing the selection)
  editorRef: null  // reference to the editor
})

export default (state = initialState, action) => {


  switch (action.type) {
    case '@@redux/INIT': {
      return state
    }
    case 'SETUP': {
      return state.merge( {
        editorRef: action.val
      } )
    }
    case 'FOCUS': {
      return state.merge( {
        focused: true,
        collapsed: action.val[0],
        bookmark: action.val[1],
        node: action.val[2]
      } )
    }
    case 'BLUR': {
      return state.merge( {
        focused: false,
        collapsed: action.val[0],
        bookmark: action.val[1],
        node: action.val[2]
      } )
    }
    case 'NODECHANGE': {
      // if (action.val[1] !== action.val[2].element)
      //
      // else
      //
      return state.merge( {
        collapsed: action.val[0],
        bookmark: action.val[1],
        node: action.val[2]
      } )
    }
    default:

      return state
  }
}