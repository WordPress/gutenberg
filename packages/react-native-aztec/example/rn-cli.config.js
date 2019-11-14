const path = require('path');

module.exports = {
  watchFolders: [path.resolve(__dirname, '..')],
  resolver: {
	  providesModuleNodeModules:[ 'react-native', 'react',],	  
  },
};