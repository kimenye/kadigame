#!/usr/bin/env rackup
# encoding: utf-8

# This file can be used to start Padrino,
# just execute it from the command line.

#sync logs
$stdout.sync = true

map '/assets' do
  run Padrino::Assets.environment
end

require File.expand_path("../config/boot.rb", __FILE__)

run Padrino.application
