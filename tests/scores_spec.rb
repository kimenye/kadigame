require 'rspec-expectations'
require 'rack/test'
require_relative '../app/scores'

describe 'Scores API' do

  let(:service) { ScoreService.new }

  it "gets the test user from the service" do
    test_user = service.get_user_by_id
    test_user.should_not be_nil
    test_user["username"].should eq("test")
  end
end