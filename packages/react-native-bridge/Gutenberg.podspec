gutenbergPackage = JSON.parse(File.read(File.join(File.expand_path('../..'), 'package.json')))
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
# Use the same RN version that the JS tools use
react_native_version = gutenbergPackage['devDependencies']['react-native']
# Extract the tagged version if package.json points to a tag
react_native_version = react_native_version.split("#v").last if react_native_version.include? "#v"

Pod::Spec.new do |s|
  s.name         = 'Gutenberg'
  s.version      = package['version']
  s.summary      = 'Printing since 1440'
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']
  s.platform     = :ios, '13.0'
  s.source       = { :git => 'https://github.com/WordPress/gutenberg.git' }
  s.source_files = 'ios/**/*.{h,m,swift}'
  s.requires_arc = true
  s.preserve_paths = 'bundle/ios/*'
  s.swift_version = '5.0'
  s.resources = 'common/**/*.{js,css,json}'

  s.dependency 'React-Core', react_native_version

  s.dependency 'RNTAztecView'
end
