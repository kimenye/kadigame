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

  it "does not get a user who doesn't exist'" do
    test_user = service.get_user_by_id(id="does_not_exist")
    test_user.should be_nil
  end

  it "lists all the users present" do
    test_users = service.get_users
    test_users.should_not be_nil
    test_users.length.should > 0
  end
end