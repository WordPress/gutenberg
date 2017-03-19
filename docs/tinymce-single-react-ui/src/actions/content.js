
export const setup = (editorRef) => ({
  type: 'SETUP',
  editorRef
})

export const nodechange = (collapsed, bookmark, node, event) => ({
  type: 'NODECHANGE',
  collapsed, bookmark, node
})

export const focus = (collapsed, bookmark, node) => ({
  type: 'FOCUS',
  collapsed, bookmark, node
})

export const blur = (collapsed, bookmark, node) => ({
  type: 'BLUR',
  collapsed, bookmark, node
})

export default { setup, nodechange, focus, blur }
