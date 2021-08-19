# -*- encoding: utf-8 -*-
require File.expand_path('../lib/angularjs-rails-resource/version', __FILE__)

Gem::Specification.new do |gem|
  gem.authors       = ["Tommy Odom", "Chris Chase"]
  gem.email         = ["odom@finelineprototyping.com", "chris@finelineprototyping.com"]
  gem.description   = %q{A small AngularJS add-on for integrating with Rails via JSON more easily.}
  gem.summary       = %q{AngularJS add-on resource add-on for integrating with Rails}
  gem.homepage      = "https://github.com/finelineprototyping/angularjs-rails-resource"
  gem.license       = 'MIT'

  gem.files         = `git ls-files`.split($\)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.name          = "angularjs-rails-resource"
  gem.require_paths = ["lib"]
  gem.version       = Angularjs::Rails::Resource::VERSION
end
