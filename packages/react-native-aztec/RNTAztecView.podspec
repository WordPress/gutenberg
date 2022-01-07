require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name             = 'RNTAztecView'
  s.version          = package['version']
  s.summary          = 'Aztec editor for React Native'
  s.license          = package['license']
  s.homepage         = package['homepage']
  s.authors          = package['author']
  s.source            = { :git => 'https://github.com/WordPress/gutenberg.git' }
  s.source_files     = 'ios/RNTAztecView/*.{h,m,swift}'
  s.public_header_files = 'ios/RNTAztecView/*.h'
  s.requires_arc     = true
  s.platforms        = { :ios => "13.0" }
  s.swift_version    = '5.0'
  s.xcconfig         = {'OTHER_LDFLAGS' => '-lxml2',
                        'HEADER_SEARCH_PATHS' => '/usr/include/libxml2'}
  s.dependency         'React-Core'
  s.dependency         'WordPress-Aztec-iOS', '~> 1.19.7'

end
